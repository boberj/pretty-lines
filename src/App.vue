<template>
  <div id="app">
    <PrettyLines />
  </div>
</template>

<script>
import PrettyLines from "./components/PrettyLines.vue";

export default {
  name: "App",
  components: {
    PrettyLines
  }
};
</script>

<style lang="scss">
.sbx-google__submit {
  display: none;
}
</style>
