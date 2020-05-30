<template>
  <div class="pl-autocomplete">
    <b-autocomplete
      v-model="name"
      keep-first
      clear-on-select
      :data="filteredOptions"
      field="value"
      placeholder="Enter the name of a country, or a state or county in the US"
      @select="selected"
    >
    </b-autocomplete>
  </div>
</template>

<script>
import { any, startsWith } from "ramda";

export default {
  name: "Complete",
  props: {
    options: Array
  },
  data() {
    return {
      name: ""
    };
  },
  computed: {
    preProcessedOptions() {
      return this.options.reduce((acc, item) => {
        acc.push({
          id: item.id,
          value: item.value,
          parts: item.value.split(",").map(i => i.trim().toLowerCase())
        });

        return acc;
      }, []);
    },
    filteredOptions() {
      // Don't provide options if just 1 character has been entered
      if (this.name.length < 2) {
        return [];
      }

      const startsWithName = startsWith(this.name.toLowerCase());

      return this.preProcessedOptions
        .filter(option => any(startsWithName)(option.parts))
        .sort(this.compareOptions);
    }
  },
  methods: {
    selected(selectedObject) {
      if (selectedObject !== null) {
        this.$emit("selected", this.options[selectedObject.id]);
      }
    },
    compareOptions(a, b) {
      // Sort countries before states and states before counties, i.e. entries with fewer parts
      // come before entries with more parts
      // Rely on pre-selected order for entries with the same number of parts (see data-loader.js)
      return a.parts.length - b.parts.length;
    }
  }
};
</script>

<style scoped lang="scss"></style>
