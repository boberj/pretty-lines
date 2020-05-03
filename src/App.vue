<template>
  <div id="app">
    <header>
      <Header />
    </header>
    <main>
      <PrettyLines />
    </main>
    <footer>
      <Footer />
    </footer>
  </div>
</template>

<script>
import Footer from "./components/Footer.vue";
import Header from "./components/Header.vue";
import PrettyLines from "./components/PrettyLines.vue";

export default {
  name: "App",
  components: {
    Footer,
    Header,
    PrettyLines
  }
};
</script>

<style lang="scss">
.sbx-google__submit {
  display: none;
}
</style>
