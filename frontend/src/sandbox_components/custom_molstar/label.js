/**
 * Copyright (c) 2018-2020 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 * @author David Sehnal <david.sehnal@gmail.com>
 */
import { __assign } from "tslib";
import {
  StructureElement,
  StructureProperties as Props,
  Unit,
} from "molstar/lib/mol-model/structure";
import { Loci } from "molstar/lib/mol-model/loci";
import { OrderedSet } from "molstar/lib/mol-data/int";
import { capitalize, stripTags } from "molstar/lib/mol-util/string";
import { Vec3 } from "molstar/lib/mol-math/linear-algebra";
import { radToDeg } from "molstar/lib/mol-math/misc";
import { Volume } from "molstar/lib/mol-model/volume";

export let DefaultLabelOptions = {
  granularity: "element",
  condensed: false,
  reverse: false,
  countsOnly: false,
  hidePrefix: false,
  htmlStyling: true,
};

export const labelProvider = {
  label: (loci) => {
    return lociLabel(loci);
  },
};

export function lociLabel(loci, options) {
  if (options === void 0) {
    options = {};
  }
  switch (loci.kind) {
    case "structure-loci":
      return loci.structure.models
        .map(function (m) {
          return m.entry;
        })
        .filter(function (l) {
          return !!l;
        })
        .join(", ");
    case "element-loci":
      return structureElementStatsLabel(
        StructureElement.Stats.ofLoci(loci),
        options
      );
    case "bond-loci":
      let bond = loci.bonds[0];
      return bond ? bondLabel(bond) : "";
    case "shape-loci":
      return loci.shape.name;
    case "group-loci":
      let g = loci.groups[0];
      return g ? loci.shape.getLabel(OrderedSet.start(g.ids), g.instance) : "";
    case "every-loci":
      return "Everything";
    case "empty-loci":
      return "Nothing";
    case "data-loci":
      return loci.getLabel();
    case "volume-loci":
      return loci.volume.label || "Volume";
    case "isosurface-loci":
      return [
        "" + (loci.volume.label || "Volume"),
        "Isosurface at " + Volume.IsoValue.toString(loci.isoValue),
      ].join(" | ");
    case "cell-loci":
      let size = OrderedSet.size(loci.indices);
      let start = OrderedSet.start(loci.indices);
      let absVal = Volume.IsoValue.absolute(loci.volume.grid.cells.data[start]);
      let relVal = Volume.IsoValue.toRelative(absVal, loci.volume.grid.stats);
      let label = [
        "" + (loci.volume.label || "Volume"),
        "" + (size === 1 ? "Cell #" + start : size + " Cells"),
      ];
      if (size === 1) {
        label.push(
          Volume.IsoValue.toString(absVal) +
            " (" +
            Volume.IsoValue.toString(relVal) +
            ")"
        );
      }
      return label.join(" | ");
  }
}

function countLabel(count, label) {
  return count === 1 ? "1 " + label : count + " " + label + "s";
}

function otherLabel(
  count,
  location,
  granularity,
  hidePrefix,
  reverse,
  condensed
) {
  return (
    elementLabel(location, {
      granularity: granularity,
      hidePrefix: hidePrefix,
      reverse: reverse,
      condensed: condensed,
    }) +
    " <small>[+ " +
    countLabel(count - 1, "other " + capitalize(granularity)) +
    "]</small>"
  );
}

/** Gets residue count of the model chain segments the unit is a subset of */
function getResidueCount(unit) {
  let elements = unit.elements,
    model = unit.model;
  let _a = model.atomicHierarchy,
    chainAtomSegments = _a.chainAtomSegments,
    residueAtomSegments = _a.residueAtomSegments;
  let elementStart =
    chainAtomSegments.offsets[chainAtomSegments.index[elements[0]]];
  let elementEnd =
    chainAtomSegments.offsets[
      chainAtomSegments.index[elements[elements.length - 1]] + 1
    ] - 1;
  return (
    residueAtomSegments.index[elementEnd] -
    residueAtomSegments.index[elementStart] +
    1
  );
}

export function structureElementStatsLabel(stats, options) {
  if (options === void 0) {
    options = {};
  }
  let o = __assign(__assign({}, DefaultLabelOptions), options);
  let label = _structureElementStatsLabel(
    stats,
    o.countsOnly,
    o.hidePrefix,
    o.condensed,
    o.reverse
  );
  return o.htmlStyling ? label : stripTags(label);
}

function _structureElementStatsLabel(
  stats,
  countsOnly,
  hidePrefix,
  condensed,
  reverse
) {
  if (countsOnly === void 0) {
    countsOnly = false;
  }
  if (hidePrefix === void 0) {
    hidePrefix = false;
  }
  if (condensed === void 0) {
    condensed = false;
  }
  if (reverse === void 0) {
    reverse = false;
  }
  let structureCount = stats.structureCount,
    chainCount = stats.chainCount,
    residueCount = stats.residueCount,
    conformationCount = stats.conformationCount,
    elementCount = stats.elementCount;
  if (
    !countsOnly &&
    elementCount === 1 &&
    residueCount === 0 &&
    chainCount === 0
  ) {
    return elementLabel(stats.firstElementLoc, {
      hidePrefix: hidePrefix,
      condensed: condensed,
      granularity: "element",
      reverse: reverse,
    });
  } else if (
    !countsOnly &&
    elementCount === 0 &&
    residueCount === 1 &&
    chainCount === 0
  ) {
    return elementLabel(stats.firstResidueLoc, {
      hidePrefix: hidePrefix,
      condensed: condensed,
      granularity: "residue",
      reverse: reverse,
    });
  } else if (
    !countsOnly &&
    elementCount === 0 &&
    residueCount === 0 &&
    chainCount === 1
  ) {
    let unit = stats.firstChainLoc.unit;
    let granularity =
      Unit.isAtomic(unit) && getResidueCount(unit) === 1
        ? "residue"
        : Unit.Traits.is(unit.traits, 1 /* MultiChain */)
        ? "residue"
        : "chain";
    return elementLabel(stats.firstChainLoc, {
      hidePrefix: hidePrefix,
      condensed: condensed,
      granularity: granularity,
      reverse: reverse,
    });
  } else if (!countsOnly) {
    let label = [];
    if (structureCount > 0) {
      label.push(
        structureCount === 1
          ? elementLabel(stats.firstStructureLoc, {
              hidePrefix: hidePrefix,
              condensed: condensed,
              granularity: "structure",
              reverse: reverse,
            })
          : otherLabel(
              structureCount,
              stats.firstStructureLoc,
              "structure",
              hidePrefix,
              reverse,
              condensed
            )
      );
    }
    if (chainCount > 0) {
      label.push(
        chainCount === 1
          ? elementLabel(stats.firstChainLoc, {
              condensed: condensed,
              granularity: "chain",
              hidePrefix: hidePrefix,
              reverse: reverse,
            })
          : otherLabel(
              chainCount,
              stats.firstChainLoc,
              "chain",
              hidePrefix,
              reverse,
              condensed
            )
      );
      hidePrefix = true;
    }
    if (residueCount > 0) {
      label.push(
        residueCount === 1
          ? elementLabel(stats.firstResidueLoc, {
              condensed: condensed,
              granularity: "residue",
              hidePrefix: hidePrefix,
              reverse: reverse,
            })
          : otherLabel(
              residueCount,
              stats.firstResidueLoc,
              "residue",
              hidePrefix,
              reverse,
              condensed
            )
      );
      hidePrefix = true;
    }
    if (conformationCount > 0) {
      label.push(
        conformationCount === 1
          ? elementLabel(stats.firstConformationLoc, {
              condensed: condensed,
              granularity: "conformation",
              hidePrefix: hidePrefix,
              reverse: reverse,
            })
          : otherLabel(
              conformationCount,
              stats.firstConformationLoc,
              "conformation",
              hidePrefix,
              reverse,
              condensed
            )
      );
      hidePrefix = true;
    }
    if (elementCount > 0) {
      label.push(
        elementCount === 1
          ? elementLabel(stats.firstElementLoc, {
              condensed: condensed,
              granularity: "element",
              hidePrefix: hidePrefix,
              reverse: reverse,
            })
          : otherLabel(
              elementCount,
              stats.firstElementLoc,
              "element",
              hidePrefix,
              reverse,
              condensed
            )
      );
    }
    return label.join("<small> + </small>");
  } else {
    let label = [];
    if (structureCount > 0) label.push(countLabel(structureCount, "Structure"));
    if (chainCount > 0) label.push(countLabel(chainCount, "Chain"));
    if (residueCount > 0) label.push(countLabel(residueCount, "Residue"));
    if (conformationCount > 0)
      label.push(countLabel(conformationCount, "Conformation"));
    if (elementCount > 0) label.push(countLabel(elementCount, "Element"));
    return label.join("<small> + </small>");
  }
}

export function bondLabel(bond, options) {
  if (options === void 0) {
    options = {};
  }
  return bundleLabel(
    {
      loci: [
        StructureElement.Loci(bond.aStructure, [
          { unit: bond.aUnit, indices: OrderedSet.ofSingleton(bond.aIndex) },
        ]),
        StructureElement.Loci(bond.bStructure, [
          { unit: bond.bUnit, indices: OrderedSet.ofSingleton(bond.bIndex) },
        ]),
      ],
    },
    options
  );
}

export function bundleLabel(bundle, options) {
  if (options === void 0) {
    options = {};
  }
  let o = __assign(__assign({}, DefaultLabelOptions), options);
  let label = _bundleLabel(bundle, o);
  return o.htmlStyling ? label : stripTags(label);
}

export function _bundleLabel(bundle, options) {
  let granularity = options.granularity,
    hidePrefix = options.hidePrefix,
    reverse = options.reverse,
    condensed = options.condensed;
  let isSingleElements = true;
  for (let _i = 0, _a = bundle.loci; _i < _a.length; _i++) {
    let l = _a[_i];
    if (!StructureElement.Loci.is(l) || StructureElement.Loci.size(l) !== 1) {
      isSingleElements = false;
      break;
    }
  }
  if (isSingleElements) {
    let locations = bundle.loci.map(function (l) {
      let _a = l.elements[0],
        unit = _a.unit,
        indices = _a.indices;
      return StructureElement.Location.create(
        l.structure,
        unit,
        unit.elements[OrderedSet.start(indices)]
      );
    });
    let labels = locations.map(function (l) {
      return _elementLabel(l, granularity, hidePrefix, reverse || condensed);
    });
    if (condensed) {
      return labels
        .map(function (l) {
          return l[0].replace(/\[.*\]/g, "").trim();
        })
        .filter(function (l) {
          return !!l;
        })
        .join(" \u2014 ");
    }
    let offset = 0;
    for (
      let i = 0,
        il =
          Math.min.apply(
            Math,
            labels.map(function (l) {
              return l.length;
            })
          ) - 1;
      i < il;
      ++i
    ) {
      let areIdentical = true;
      for (let j = 1, jl = labels.length; j < jl; ++j) {
        if (labels[0][i] !== labels[j][i]) {
          areIdentical = false;
          break;
        }
      }
      if (areIdentical) offset += 1;
      else break;
    }
    if (offset > 0) {
      let offsetLabels = [labels[0].join(" | ")];
      for (let j = 1, jl = labels.length; j < jl; ++j) {
        offsetLabels.push(
          labels[j]
            .slice(offset)
            .filter(function (l) {
              return !!l;
            })
            .join(" | ")
        );
      }
      return offsetLabels.join(" \u2014 ");
    } else {
      return labels
        .map(function (l) {
          return l
            .filter(function (l) {
              return !!l;
            })
            .join(" | ");
        })
        .filter(function (l) {
          return !!l;
        })
        .join("</br>");
    }
  } else {
    let labels = bundle.loci.map(function (l) {
      return lociLabel(l, options);
    });
    return labels
      .filter(function (l) {
        return !!l;
      })
      .join(condensed ? " \u2014 " : "</br>");
  }
}

export function elementLabel(location, options) {
  let _a, _b;
  if (options === void 0) {
    options = {};
  }
  let o = __assign(__assign({}, DefaultLabelOptions), options);
  let _label = _elementLabel(
    location,
    o.granularity,
    o.hidePrefix,
    o.reverse || o.condensed
  );
  // TODO: condensed label for single atom structure returns empty label.. handle this case here?
  let label = o.condensed
    ? (_b =
        (_a = _label[0]) === null || _a === void 0
          ? void 0
          : _a.replace(/\[.*\]/g, "").trim()) !== null && _b !== void 0
      ? _b
      : ""
    : _label
        .filter(function (l) {
          return !!l;
        })
        .join(" | ");
  return o.htmlStyling ? label : stripTags(label);
}

function _elementLabel(location, granularity, hidePrefix, reverse) {
  if (granularity === void 0) {
    granularity = "element";
  }
  if (hidePrefix === void 0) {
    hidePrefix = false;
  }
  if (reverse === void 0) {
    reverse = false;
  }
  let label = [];
  if (!hidePrefix) {
    let entry = location.unit.model.entry;
    if (entry.length > 30) entry = entry.substr(0, 27) + "\u2026"; // ellipsis
    // label.push("<small>" + entry + "</small>"); // entry
    // if (granularity !== "structure") {
    //
    //   label.push("<small>Model " + location.unit.model.modelNum + "</small>"); // model
    //   label.push(
    //     "<small>Instance " +
    //       location.unit.conformation.operator.name +
    //       "</small>"
    //
    //   ); // instance
    // }
  }
  if (Unit.isAtomic(location.unit)) {
    label.push.apply(
      label,
      _atomicElementLabel(location, granularity, reverse)
    );
  } else if (Unit.isCoarse(location.unit)) {
    label.push.apply(label, _coarseElementLabel(location, granularity));
  } else {
    label.push("Unknown");
  }
  return reverse ? label.reverse() : label;
}

function _atomicElementLabel(location, granularity, hideOccupancy) {
  if (hideOccupancy === void 0) {
    hideOccupancy = false;
  }
  let rI = StructureElement.Location.residueIndex(location);
  let label_asym_id = Props.chain.label_asym_id(location);
  let auth_asym_id = Props.chain.auth_asym_id(location);
  let has_label_seq_id =
    location.unit.model.atomicHierarchy.residues.label_seq_id.valueKind(rI) ===
    0; /* Present */
  let confidence = location.unit.model.atomicConformation.B_iso_or_equiv.value(
    location.element
  );
  let label_seq_id = Props.residue.label_seq_id(location);
  let auth_seq_id = Props.residue.auth_seq_id(location);
  let ins_code = Props.residue.pdbx_PDB_ins_code(location);
  let comp_id = Props.atom.label_comp_id(location);
  let atom_id = Props.atom.label_atom_id(location);
  let alt_id = Props.atom.label_alt_id(location);
  let occupancy = Props.atom.occupancy(location);
  let microHetCompIds = Props.residue.microheterogeneityCompIds(location);
  let compId =
    granularity === "residue" && microHetCompIds.length > 1
      ? "(" + microHetCompIds.join("|") + ")"
      : comp_id;
  let label = [];
  switch (granularity) {
    case "element":
      label.push("<b>" + atom_id + "</b>" + (alt_id ? "%" + alt_id : ""));
    case "conformation":
      if (granularity === "conformation" && alt_id) {
        label.push("<small>Conformation</small> <b>" + alt_id + "</b>");
      }
    case "residue":
      let seq_id =
        label_seq_id === auth_seq_id || !has_label_seq_id
          ? auth_seq_id
          : label_seq_id;
      label.push(
        "<b>" +
          compId +
          " " +
          seq_id +
          "</b>" +
          // (seq_id !== auth_seq_id
          //   ? " <small>[auth</small> <b>" + auth_seq_id + "</b><small>]</small>"
          //   : "") +
          "<b>" +
          (ins_code ? ins_code : "") +
          "</b>" +
          "<br>" +
          (confidence < 51
            ? "<span style='color: #ce6a1b'> Confidence Score: " +confidence + " <small>( Very low )</span></small>"
            : confidence < 71
            ? "<span style='color: #a48300'> Confidence Score: " +confidence + " <small>( Low )</span></small>"
            : confidence < 91
            ? "<span style='color: #0059b7'> Confidence Score: " +confidence + " <small>( Confident )</span></small>"
            : "<span style='color: #7824ff'> Confidence Score: " +confidence + " <small>( Very high )</span></small>"
          )
      );
    case "chain":
      if (label_asym_id === auth_asym_id) {
        // label.push("<b>" + label_asym_id + "</b>");
      } else {
        if (
          granularity === "chain" &&
          Unit.Traits.is(location.unit.traits, 1 /* MultiChain */)
        ) {
          label.push(
            "<small>[auth</small> <b>" + auth_asym_id + "</b><small>]</small>"
          );
        } else {
          label.push(
            "<b>" +
              label_asym_id +
              "</b> <small>[auth</small> <b>" +
              auth_asym_id +
              "</b><small>]</small>"
          );
        }
      }
  }
  if (label.length > 0 && occupancy !== 1 && !hideOccupancy) {
    label[0] =
      label[0] +
      " <small>[occupancy</small> <b>" +
      Math.round(100 * occupancy) / 100 +
      "</b><small>]</small>";
  }
  return label.reverse();
}

function _coarseElementLabel(location, granularity) {
  let asym_id = Props.coarse.asym_id(location);
  let seq_id_begin = Props.coarse.seq_id_begin(location);
  let seq_id_end = Props.coarse.seq_id_end(location);
  let label = [];
  switch (granularity) {
    case "element":
    case "conformation":
    case "residue":
      if (seq_id_begin === seq_id_end) {
        let entityIndex = Props.coarse.entityKey(location);
        let seq = location.unit.model.sequence.byEntityKey[entityIndex];
        let comp_id = seq.sequence.compId.value(seq_id_begin - 1); // 1-indexed
        label.push("<b>" + comp_id + " " + seq_id_begin + "</b>");
      } else {
        label.push("<b>" + seq_id_begin + "-" + seq_id_end + "</b>");
      }
    case "chain":
      label.push("<b>" + asym_id + "</b>");
  }
  return label.reverse();
}

//
export function distanceLabel(pair, options) {
  if (options === void 0) {
    options = {};
  }
  let o = __assign(
    __assign(__assign({}, DefaultLabelOptions), {
      measureOnly: false,
      unitLabel: "\u212B",
    }),
    options
  );
  let _a = pair.loci.map(function (l) {
      return Loci.getCenter(l);
    }),
    cA = _a[0],
    cB = _a[1];
  let distance = Vec3.distance(cA, cB).toFixed(2) + " " + o.unitLabel;
  if (o.measureOnly) return distance;
  let label = bundleLabel(pair, o);
  return o.condensed
    ? distance + " | " + label
    : "Distance " + distance + "</br>" + label;
}

export function angleLabel(triple, options) {
  if (options === void 0) {
    options = {};
  }
  let o = __assign(
    __assign(__assign({}, DefaultLabelOptions), { measureOnly: false }),
    options
  );
  let _a = triple.loci.map(function (l) {
      return Loci.getCenter(l);
    }),
    cA = _a[0],
    cB = _a[1],
    cC = _a[2];
  let vAB = Vec3.sub(Vec3(), cA, cB);
  let vCB = Vec3.sub(Vec3(), cC, cB);
  let angle = radToDeg(Vec3.angle(vAB, vCB)).toFixed(2) + "\u00B0";
  if (o.measureOnly) return angle;
  let label = bundleLabel(triple, o);
  return o.condensed
    ? angle + " | " + label
    : "Angle " + angle + "</br>" + label;
}

export function dihedralLabel(quad, options) {
  if (options === void 0) {
    options = {};
  }
  let o = __assign(
    __assign(__assign({}, DefaultLabelOptions), { measureOnly: false }),
    options
  );
  let _a = quad.loci.map(function (l) {
      return Loci.getCenter(l);
    }),
    cA = _a[0],
    cB = _a[1],
    cC = _a[2],
    cD = _a[3];
  let dihedral =
    radToDeg(Vec3.dihedralAngle(cA, cB, cC, cD)).toFixed(2) + "\u00B0";
  if (o.measureOnly) return dihedral;
  let label = bundleLabel(quad, o);
  return o.condensed
    ? dihedral + " | " + label
    : "Dihedral " + dihedral + "</br>" + label;
}

//# sourceMappingURL=label.js.map
