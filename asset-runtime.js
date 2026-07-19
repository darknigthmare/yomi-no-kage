(() => {
  "use strict";

  /*
   * Les banques d'animation complètes dépassent la taille d'un déploiement
   * Vercel Hobby. Elles restent versionnées avec le jeu dans GitHub et sont
   * servies depuis un tag immuable en production. En local, les chemins restent
   * inchangés afin que l'édition et les validateurs travaillent sur les sources.
   */
  const releaseRef = "complete-campaign-v2";
  const repositoryRoot = `https://raw.githubusercontent.com/darknigthmare/yomi-no-kage/${releaseRef}/`;
  const hostname = typeof location === "object" ? String(location.hostname || "") : "";
  const remoteAssets = /(^|\.)vercel\.app$/i.test(hostname);

  function resolve(path) {
    const value = String(path || "");
    if (!remoteAssets || !value.startsWith("assets/")) return value;
    return `${repositoryRoot}${value}`;
  }

  window.KageAssets = Object.freeze({
    releaseRef,
    repositoryRoot,
    remoteAssets,
    resolve,
  });
})();
