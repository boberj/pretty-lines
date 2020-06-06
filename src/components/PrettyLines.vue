<template>
  <div class="pretty-lines">
    <div class="section">
      <div class="container">
        <div class="columns">
          <div class="column is-half is-offset-one-quarter">
            <Autocomplete :options="autocompleteOptions" @selected="addArea" />
            <div class="tags-container">
              <div class="field is-grouped is-grouped-multiline">
                <div class="control" v-for="selection in selectedAreas" :key="selection.id">
                  <div class="tags has-addons">
                    <span
                      class="tag"
                      :style="{ backgroundColor: strokeColor(selection.id) }"
                    ></span>
                    <span class="tag">
                      {{ selection.area.value }}
                    </span>
                    <a class="tag is-delete" @click="removeArea(selection.id)"></a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="container">
        <div class="columns">
          <div class="column">
            <Chart :data="chartData" :controls="controls" />
          </div>
        </div>
      </div>
      <div class="columns is-centered is-vcentered">
        <div class="column is-narrow">
          <div class="field">
            <b-checkbox v-model="controls.logScale">
              Log scale
            </b-checkbox>
          </div>
        </div>
        <div class="column is-narrow">
          <div class="field">
            <b-checkbox v-model="controls.normalize">
              Normalize
            </b-checkbox>
          </div>
        </div>
        <div class="column is-narrow">
          <b-field>
            <b-radio-button v-model="controls.dataView" native-value="cases">
              Cases
            </b-radio-button>
            <b-radio-button v-model="controls.dataView" native-value="deaths">
              Deaths
            </b-radio-button>
          </b-field>
        </div>
        <div class="column is-narrow">
          <b-field>
            <b-radio-button v-model="controls.count" native-value="movingDaily">
              Daily
            </b-radio-button>
            <b-radio-button v-model="controls.count" native-value="cumulative">
              Cumulative
            </b-radio-button>
          </b-field>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Autocomplete from "./Autocomplete.vue";
import Chart from "./Chart.vue";
import * as d3 from "d3";
import loadData from "../lib/data-loader.js";

export default {
  name: "PrettyLines",
  components: {
    Autocomplete,
    Chart
  },
  data() {
    return {
      data: [],
      autocompleteOptions: [],
      selectedAreas: [],
      selectedAreasTotalCounter: 0,
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
  computed: {
    chartData() {
      return this.selectedAreas.map(selection => ({
        id: selection.id,
        data: this.data[selection.area.id]
      }));
    }
  },
  methods: {
    async loadData() {
      const data = await loadData();

      this.autocompleteOptions = Object.freeze(
        data.map((area, index) => ({
          id: index,
          value: area.key
        }))
      );

      this.data = Object.freeze(data);
    },
    addArea(area) {
      if (this.selectedAreas.findIndex(selection => selection.area.id === area.id) === -1) {
        this.selectedAreasTotalCounter++;
        this.selectedAreas.push({
          id: this.selectedAreasTotalCounter - 1,
          area: area
        });
      }
    },
    removeArea(selectionId) {
      this.selectedAreas = this.selectedAreas.filter(selection => selection.id !== selectionId);
    },
    strokeColor(i) {
      return d3.schemeTableau10[i % 10];
    }
  }
};
</script>

<style scoped lang="scss">
.tags-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
