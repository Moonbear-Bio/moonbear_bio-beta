import React, { useEffect, useRef, useState } from "react";

import "../themes/molstar-theme.css";
import { createPluginAsync } from "molstar/lib/mol-plugin-ui/index";

import {
  DefaultPluginUISpec,
  PluginUISpec,
} from "molstar/lib/mol-plugin-ui/spec";
import { PluginConfig } from "molstar/lib/mol-plugin/config";
import {
  DownloadStructure,
  PdbDownloadProvider,
} from "molstar/lib/mol-plugin-state/actions/structure";
import { UncertaintyColorThemeProvider } from "molstar/lib/mol-theme/color/uncertainty";
import { ParamDefinition as PD } from "molstar/lib/mol-util/param-definition";
import { getColorListFromName } from "molstar/lib/mol-util/color/lists";
import { ColorList } from "molstar/lib/mol-util/color/color";
import {StructureElement, StructureProperties as Props} from "molstar/lib/mol-model/structure";

const MySpec = {
  ...DefaultPluginUISpec(),
  config: [
    [PluginConfig.VolumeStreaming.Enabled, false],
    [PluginConfig.Viewport.ShowExpand, true],
    [PluginConfig.Viewport.ShowControls, true],
    [PluginConfig.Viewport.ShowSettings, false],
    [PluginConfig.Viewport.ShowAnimation, false],
  ],
  components: {
    ...DefaultPluginUISpec().components,
    hideTaskOverlay: false,
    // controls: { left: "full", right: "full", top: "full", bottom: "full" },
  },
  layout: {
    initial: {
      showControls: true,
      isExpanded: false,
      regionState: {
        left: "hidden",
        right: "hidden",
        top: "full",
        bottom: "hidden",
      },
    },
  },
};

const MolstarRender = (props) => {
  const { pdb, options } = props;
  const parent = React.createRef();
  const [initialized, setInitialized] = React.useState(false);
  const plugin = React.useRef();

  const labelProvider = {
    label: (location) => {
      if (!plugin.params.showTooltip) return void 0;

      switch (location.kind) {
        case 'residue':
          if (location.elements.length === 0) return void 0;
          const label = [];
          let label_seq_id = Props.residue.label_seq_id(location);
          let ins_code = Props.residue.pdbx_PDB_ins_code(location);
          let confidence = location.unit.model.atomicConformation.B_iso_or_equiv.value(location.element)
          let has_label_seq_id = location.unit.model.atomicHierarchy.residues.label_seq_id.valueKind(rI) === 0 /* Present */;
          let auth_seq_id = Props.residue.auth_seq_id(location);
          let comp_id = Props.atom.label_comp_id(location);
          let microHetCompIds = Props.residue.microheterogeneityCompIds(location);
          let compId = location.kind === 'residue' && microHetCompIds.length > 1 ?
              "(" + microHetCompIds.join('|') + ")" : comp_id;
          var rI = StructureElement.Location.residueIndex(location);

          let seq_id = label_seq_id === auth_seq_id || !has_label_seq_id ? auth_seq_id : label_seq_id;
          label.push("<b>" + compId + " " + seq_id + "</b>" + (seq_id !== auth_seq_id ? " <small>[auth</small> <b>" + auth_seq_id + "</b><small>]</small>" : '') + "<b>" + (ins_code ? ins_code : '') + "</b>" + "<br>" + "Confidence Score: " + confidence + " <small>( " + (confidence < 50 ? "Very low" : (confidence < 70 ? "Low" : (confidence < 90? "Confident" : "Very high")))+ " )</small>");

          return label.reverse

        default: return void 0;
      }
    }
  }

  useEffect(() => {
    async function init() {
      plugin.current = await createPluginAsync(parent.current, MySpec);
      setInitialized(true);
    }
    init();
    return () => {
      plugin.current?.dispose();
      plugin.current = null;
    };
  }, []);

  useEffect(() => {
    if (!initialized || !plugin.current) return;
    loadStructureFromData(pdb, "pdb");
    // plugin.managers.lociLabels.addProvider(labelProvider);
    // sync state here
  }, [initialized, pdb]);

  async function loadStructureFromData(data, format, options) {
    const _data = await plugin.current.builders.data.rawData({
      data,
      label: options?.dataLabel,
    });
    const trajectory = await plugin.current.builders.structure.parseTrajectory(
      _data,
      format
    );
    const model = await plugin.current.builders.structure.createModel(
      trajectory
    );
    const structure = await plugin.current.builders.structure.createStructure(
      model
    );

    const components = {
      polymer: await plugin.current.builders.structure.tryCreateComponentStatic(
        structure,
        "polymer"
      ),
      ligand: await plugin.current.builders.structure.tryCreateComponentStatic(
        structure,
        "ligand"
      ),
      water: await plugin.current.builders.structure.tryCreateComponentStatic(
        structure,
        "water"
      ),
    };

    const builder = plugin.current.builders.structure.representation;
    const update = plugin.current.build();

    // const colors = getColorListFromName('turbo');
    // add another exp of color values to make discrete colors more apparent
    const colors = ColorList(
      "alphafold",
      "qualitative",
      "Improved (smooth) rainbow colormap for visualization",
      errorColors
    );
    const colorParams = { list: { kind: "set", colors: colors.list } };

    if (components.polymer)
      builder.buildRepresentation(
        update,
        components.polymer,
        { type: "cartoon", color: "uncertainty", colorParams: colorParams },
        { tag: "polymer" }
      );
    if (components.ligand)
      builder.buildRepresentation(
        update,
        components.ligand,
        { type: "ball-and-stick" },
        { tag: "ligand" }
      );
    if (components.water)
      builder.buildRepresentation(
        update,
        components.water,
        { type: "ball-and-stick", typeParams: { alpha: 0.6 } },
        { tag: "water" }
      );

    await update.commit();
  }

  return <div ref={parent} />;
};

const createErrorColors = (exp) => {
  let colors = [];
  for (let i = 0; i < exp; i++) {
    colors.push(0x7824ff);
  }
  for (let i = 0; i < exp * 2; i++) {
    colors.push(0x55bff0);
  }
  for (let i = 0; i < exp * 2; i++) {
    colors.push(0xffde38);
  }
  for (let i = 0; i < exp * 5; i++) {
    colors.push(0xff7300);
  }
  return colors;
};
const errorColors = createErrorColors(16);

export default MolstarRender;
