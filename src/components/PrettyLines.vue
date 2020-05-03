<template>
  <div class="Pretty Lines">
    <nav class="top-nav">
      <div class="container">
        <div class="nav-wrapper">
          <div class="row">
            <div class="col s12">
              <h1 class="header">COVID-19</h1>
            </div>
          </div>
        </div>
      </div>
    </nav>
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
              <input type="radio" value="daily" v-model="controls.count" disabled="disabled" />
              <span>Daily</span>
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
import stateAbbreviations from "../state-abbreviations";

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
    async loadData() {
      const states = await this.loadStates();
      const counties = await this.loadCounties();
      const world = await this.loadWorld();

      const areas = states.concat(counties, world);

      this.suggestions = Object.freeze(
        areas.map((area, index) => ({
          id: index,
          value: area.key
        }))
      );

      this.data = Object.freeze(areas);
    },
    async loadStates() {
      const data = await d3.csv(
        "https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-states.csv",
        d => {
          d.date = this.parseDate(d.date);
          d.cases = parseInt(d.cases);
          d.deaths = parseInt(d.deaths);
          return d;
        }
      );

      return this.partition(item => item.state)(data);
    },
    async loadCounties() {
      const data = await d3.csv(
        "https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv",
        d => {
          d.date = this.parseDate(d.date);
          d.cases = parseInt(d.cases);
          d.deaths = parseInt(d.deaths);
          return d;
        }
      );

      const nameF = item => {
        const stateAbbreviation = stateAbbreviations[item.state] || item.state;

        return `${item.county}, ${stateAbbreviation}`;
      };

      return this.partition(nameF)(data);
    },
    async loadWorld() {
      const cases = await d3.csv(
        "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv"
      );

      const deaths = await d3.csv(
        "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv"
      );

      const casesAndDeaths = d3.zip(cases, deaths);
      const dates = cases.columns.slice(4); // Remove region and position columns

      const key = item => {
        const region1 = item["Country/Region"];
        const region2 = item["Province/State"];
        return [region2, region1].filter(i => i.length > 0).join(", ");
      };

      const values = (cases, deaths) =>
        dates.map(date => ({
          date: this.parseUsDate(date),
          cases: parseInt(cases[date]),
          deaths: parseInt(deaths[date])
        }));

      const entry = (cases, deaths) => ({
        key: key(cases),
        values: values(cases, deaths)
      });

      return casesAndDeaths.map(item => entry(item[0], item[1]));
    },
    generateGraph(data) {
      const height = 500;
      const width = 800;
      const margin = { top: 20, right: 30, bottom: 30, left: 70 };
      const flatData = this.flatten(data);

      const valueF = this.controls.dataView == "cases" ? d => d.cases : d => d.deaths;
      const validatorF = d => !isNaN(valueF(d)) && (this.controls.logScale ? valueF(d) > 0 : true);

      const line = d3
        .line()
        .defined(validatorF)
        .x(d => x(d.date))
        .y(d => y(valueF(d)));

      const x = d3
        .scaleUtc()
        .domain(d3.extent(flatData, d => d.date))
        .range([margin.left, width - margin.right]);

      const yDomainMin = this.controls.logScale ? 1 : 0;
      const yScale = this.controls.logScale ? d3.scaleLog() : d3.scaleLinear();

      const y = yScale
        .domain([yDomainMin, d3.max(flatData, valueF)])
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
    partition: keyF => data =>
      d3
        .nest()
        .key(keyF)
        .entries(data),
    flatten(data) {
      return data.map(entry => entry.values).flat();
    },
    parseDate: d3.utcParse("%Y-%m-%d"),
    parseUsDate: d3.utcParse("%m/%d/%y")
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