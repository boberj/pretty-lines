<template>
  <div class="autocomplete">
    <vue-instant
      :suggestions="suggestions"
      :suggestion-attribute="suggestionAttribute"
      :disabled="false"
      :show-autocomplete="true"
      :autofocus="true"
      v-model="value"
      @selected="selected"
      @enter="commit"
      @click-input="commit"
      name="customName"
      placeholder="Enter the name of a state or county"
      type="google"
    ></vue-instant>
  </div>
</template>

<script>
export default {
  name: "AutoComplete",
  props: {
    suggestions: Array,
    suggestionAttribute: String
  },
  data() {
    return {
      value: "",
      selectedObject: undefined
    };
  },
  methods: {
    selected(selectedObject) {
      this.selectedObject = selectedObject;
    },
    commit() {
      if (this.selectedObject != undefined) {
        this.$emit("selected", this.selectedObject);
        this.value = "";
      }
    }
  }
};
</script>

<style scoped lang="scss"></style>
