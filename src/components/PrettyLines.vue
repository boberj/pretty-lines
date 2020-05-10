<template>
  <div class="pretty-lines">
    <div class="container main">
      <div class="row">
        <div class="col s12">
          <div class="center">
            <AutoComplete
              :suggestions="suggestions"
              :suggestion-attribute="suggestionAttribute"
              @selected="addArea"
            />
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col s12 center">
          <ul>
            <li class="chip" v-for="(area, i) in selectedAreas" :key="area.id">
              <svg viewBox="0 0 10 10" width="10px" height="10px">
                <line
                  x1="0"
                  y1="6"
                  x2="10"
                  y2="6"
                  :stroke="strokeColor(i)"
                  stroke-width="1.5"
                  stroke-linejoin="round"
                  stroke-linecap="round"
                />
              </svg>
              {{ area.value }}
              <i class="close material-icons" @click="removeArea(area.id)">close</i>
            </li>
          </ul>
        </div>
      </div>
      <div class="row">
        <div id="graph" class="col s12 center"></div>
      </div>
      <div class="row">
        <div class="col s3"></div>
        <div class="col s2">
          <p>
            <label>
              <input type="checkbox" v-model="controls.logScale" />
              <span>Log scale</span>
            </label>
          </p>
          <p>
            <label>
              <input type="checkbox" v-model="controls.normalize" />
              <span title="Per 100,000 inhabitants">Normalize</span>
            </label>
          </p>
        </div>
        <div class="col s2">
          <p>
            <label>
              <input type="radio" value="cases" v-model="controls.dataView" />
              <span>Cases</span>
            </label>
          </p>
          <p>
            <label>
              <input type="radio" value="deaths" v-model="controls.dataView" />
              <span>Deaths</span>
            </label>
          </p>
        </div>
        <div class="col s2">
          <p>
            <label>
              <input type="radio" value="daily" v-model="controls.count" />
              <span>Daily</span>
            </label>
          </p>
          <p>
            <label>
              <input type="radio" value="movingDaily" v-model="controls.count" />
              <span>Daily (7 day moving average)</span>
            </label>
          </p>
          <p>
            <label>
              <input type="radio" value="cumulative" v-model="controls.count" />
              <span>Cumulative</span>
            </label>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AutoComplete from "./AutoComplete.vue";
import * as d3 from "d3";
import loadData from "../lib/data-loader.js";

export default {
  name: "PrettyLines",
  components: {
    AutoComplete
  },
  data() {
    return {
      data: [],
      suggestions: [],
      suggestionAttribute: "value",
      selectedAreas: [],
      controls: {
        logScale: false,
        normalize: false,
        dataView: "cases",
        count: "cumulative"
      }
    };
  },
  async mounted() {
    await this.loadData();
  },
  watch: {
    selectedAreas() {
      this.generateGraph(this.computeData());
    },
    controls: {
      handler() {
        this.generateGraph(this.computeData());
      },
      deep: true
    }
  },
  methods: {
    async loadData() {
      const data = await loadData();

      this.suggestions = Object.freeze(
        data.map((area, index) => ({
          id: index,
          value: area.key
        }))
      );

      this.data = Object.freeze(data);
    },
    computeData() {
      return this.selectedAreas.map(selectedArea => this.data[selectedArea.id]);
    },
    addArea(area) {
      if (!this.selectedAreas.includes(area)) {
        this.selectedAreas.push(area);
      }
    },
    removeArea(areaId) {
      this.selectedAreas = this.selectedAreas.filter(area => area.id != areaId);
    },
    generateGraph(data) {
      const height = 500;
      const width = 800;
      const margin = { top: 20, right: 30, bottom: 30, left: 70 };
      const yDomainMin = this.controls.logScale ? 1 : 0;
      const flatData = this.flatten(data);

      const valueAccessorFns = {
        cases: {
          daily: d => d.newCases,
          movingDaily: d => d.movingNewCases,
          cumulative: d => d.cases
        },
        deaths: {
          daily: d => d.newDeaths,
          movingDaily: d => d.movingNewDeaths,
          cumulative: d => d.deaths
        }
      };

      const accessorFn = valueAccessorFns[this.controls.dataView][this.controls.count];

      const valueFn = d => {
        const value = accessorFn(d);

        return this.controls.normalize ? (100000 * value) / d.population : value;
      };

      const validatorFn = d =>
        (!this.controls.normalize || d.population != undefined) &&
        !isNaN(valueFn(d)) &&
        valueFn(d) > yDomainMin;

      const line = d3
        .line()
        .defined(validatorFn)
        .x(d => x(d.date))
        .y(d => y(valueFn(d)));

      const x = d3
        .scaleUtc()
        .domain(d3.extent(flatData, d => d.date))
        .range([margin.left, width - margin.right]);

      const yScale = this.controls.logScale ? d3.scaleLog() : d3.scaleLinear();

      const y = yScale
        .domain([yDomainMin, d3.max(flatData, valueFn)])
        .nice()
        .range([height - margin.bottom, margin.top]);

      const xAxis = g =>
        g.attr("transform", `translate(0,${height - margin.bottom})`).call(
          d3
            .axisBottom(x)
            .ticks(width / 80)
            .tickSizeOuter(0)
        );

      const yAxis = g =>
        g
          .attr("transform", `translate(${margin.left},0)`)
          .call(d3.axisLeft(y).ticks(10, ",.2r"))
          .call(g => g.select(".domain").remove());

      d3.select("#graph")
        .select("svg")
        .remove();

      const svg = d3
        .select("#graph")
        .append("svg")
        .attr("height", height)
        .attr("width", width);

      svg.append("g").call(xAxis);

      svg.append("g").call(yAxis);

      data.forEach((area, i) =>
        svg
          .append("path")
          .datum(area.values)
          .attr("fill", "none")
          .attr("stroke", this.strokeColor(i))
          .attr("stroke-width", 1.5)
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("d", line)
      );
    },
    strokeColor(i) {
      return d3.schemeTableau10[i % 10];
    },
    flatten(data) {
      return data.map(entry => entry.values).flat();
    }
  }
};
</script>

<style scoped lang="scss">
.chip {
  font-weight: bold;
}

.top-nav {
  height: 110px;
  box-shadow: none;
  border-bottom: 1px solid rgba(0, 0, 0, 0.14);
  background-color: transparent;
  margin-bottom: 30px;
}

.header {
  margin: 0px;
  padding-top: 22px;
  color: rgba(0, 0, 0, 0.14);
  font-weight: 300;
}
</style>
