// Sets light or dark before the first paint. The server already sets it when the account has an explicit choice.
(function () {
  try {
    var root = document.documentElement;
    if (root.dataset.appearance) return;
    var saved = JSON.parse(localStorage.getItem(root.dataset.appearanceKey) || "null");
    var mode = (saved && saved.mode) || "system";
    root.dataset.appearance = mode === "dark" || (mode === "system" && matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
  } catch (error) {}
})();
