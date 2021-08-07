import { Color, ColorScale } from 'molstar/lib/mol-util/color';
import { StructureElement, Unit, Bond, ElementIndex } from 'molstar/lib/mol-model/structure';
import { Location } from 'molstar/lib/mol-model/location';
import { ColorTheme } from 'molstar/lib/mol-theme/color';
import { ParamDefinition as PD } from 'molstar/lib/mol-util/param-definition';
import { ThemeDataContext } from 'molstar/lib/mol-theme/theme';

const DefaultUncertaintyColor = Color(0xffff99);
const Description = `Assigns a color based on the uncertainty or disorder of an element's position, e.g. B-factor or RMSF, depending on the data availability and experimental technique.`;

export const UncertaintyColorThemeParams = {
    domain: PD.Interval([0, 100]),
    list: PD.ColorList('red-white-blue', { presetKind: 'scale' }),
};
export type UncertaintyColorThemeParams = typeof UncertaintyColorThemeParams
export function getUncertaintyColorThemeParams(ctx: ThemeDataContext) {
    return UncertaintyColorThemeParams; // TODO return copy
}

export function getUncertainty(unit: Unit, element: ElementIndex): number {
    if (Unit.isAtomic(unit)) {
        return unit.model.atomicConformation.B_iso_or_equiv.value(element);
    } else if (Unit.isSpheres(unit)) {
        return unit.model.coarseConformation.spheres.rmsf[element];
    } else {
        return 0;
    }
}

export function UncertaintyColorTheme(ctx: ThemeDataContext, props: PD.Values<UncertaintyColorThemeParams>): ColorTheme<UncertaintyColorThemeParams> {
    const scale = ColorScale.create({
        reverse: true,
        domain: props.domain,
        listOrName: props.list.colors,
    });

    // TODO calc domain based on data, set min/max as 10/90 percentile to be robust against outliers

    function color(location: Location): Color {
        if (StructureElement.Location.is(location)) {
            return scale.color(getUncertainty(location.unit, location.element));
        } else if (Bond.isLocation(location)) {
            return scale.color(getUncertainty(location.aUnit, location.aUnit.elements[location.aIndex]));
        }
        return DefaultUncertaintyColor;
    }

    return {
        factory: UncertaintyColorTheme,
        granularity: 'group',
        preferSmoothing: true,
        color,
        props,
        description: Description,
        legend: scale ? scale.legend : undefined
    };
}

export const UncertaintyColorThemeProvider: ColorTheme.Provider<UncertaintyColorThemeParams, 'uncertainty'> = {
    name: 'uncertainty',
    label: 'Uncertainty/Disorder',
    category: ColorTheme.Category.Atom,
    factory: UncertaintyColorTheme,
    getParams: getUncertaintyColorThemeParams,
    defaultValues: PD.getDefaultValues(UncertaintyColorThemeParams),
    isApplicable: (ctx: ThemeDataContext) => !!ctx.structure && ctx.structure.models.some(m => m.atomicConformation.B_iso_or_equiv.isDefined || m.coarseHierarchy.isDefined)
};