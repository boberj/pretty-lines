<template>
  <div class="pl-chart">
    <div ref="chart" id="chart"></div>
  </div>
</template>

<script>
import * as d3 from "d3";
import * as MG from "metrics-graphics";

export default {
  name: "Chart",
  props: {
    data: Array,
    controls: Object
  },
  data() {
    return {
      width: 800
    };
  },
  mounted() {
    this.width = this.$refs.chart.parentNode.clientWidth;
  },
  watch: {
    data() {
      this.redraw();
    },
    controls: {
      handler() {
        this.redraw();
      },
      deep: true
    }
  },
  computed: {},
  methods: {
    redraw() {
      this.$refs.chart.innerHTML = "";

      if (this.data.length === 0) {
        return;
      }

      const valueAccessorFns = {
        cases: {
          daily: "newCases",
          movingDaily: "movingNewCases",
          cumulative: "cases"
        },
        deaths: {
          daily: "newDeaths",
          movingDaily: "movingNewDeaths",
          cumulative: "deaths"
        }
      };

      const yAccessor = valueAccessorFns[this.controls.dataView][this.controls.count];
      const yScale = this.controls.logScale ? "log" : "linear";
      const yDomainMin = this.controls.logScale ? 1 : 0;

      const normalize = item => (100000 * item[yAccessor]) / item.population;
      const identity = item => item[yAccessor];
      const valueTransformer = this.controls.normalize ? normalize : identity;

      const chartData = this.data.map(item =>
        item.data.values
          .map(item => ({ date: item.date, value: valueTransformer(item) }))
          .filter(i => i.value >= yDomainMin)
      );

      const labels = this.data.map(item => item.data.key);
      const lineColors = this.data.map(item => d3.schemeTableau10[item.id % 10]);

      const leftPadding = this.width > 400 ? 150 : 50;
      const rightPadding = this.width > 400 ? 200 : 50;
      const height = (this.width - rightPadding) * 0.5;

      MG.data_graphic({
        data: chartData,
        width: this.width,
        height: height,
        left: leftPadding,
        right: rightPadding,
        top: 30,
        small_height_threshold: 200,
        small_width_threshold: 400,
        target: "#chart",
        x_accessor: "date",
        y_accessor: "value",
        colors: lineColors,
        legend: labels,
        aggregate_rollover: true,
        mouseover_align: "left",
        y_extended_ticks: true,
        y_scale_type: yScale,
        brush: "x"
      });
    }
  }
};
</script>
