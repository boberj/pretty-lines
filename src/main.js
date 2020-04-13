import Vue from "vue";
import App from "./App.vue";
import VueInstant from "vue-instant/dist/vue-instant.common";

import "materialize-css/dist/css/materialize.min.css";
import "material-design-icons/iconfont/material-icons.css";
import "vue-instant/dist/vue-instant.css";

Vue.use(VueInstant);

Vue.config.productionTip = false;

new Vue({
  render: h => h(App)
}).$mount("#app");
