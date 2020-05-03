module.exports = {
  changeImportDeclartion(j, root, sourceName, specifierName) {
    let importedNodes = root
      .find(j.ImportDeclaration)
      .filter((p) => p.value && p.value.source && p.value.source.value === sourceName);
    if (importedNodes.length) {
      let isOperatorAlreadyPresent = false;
      for (let i = 0; i < importedNodes.length; i++) {
        if (
          importedNodes
            .get(i)
            .node.specifiers.includes(({ imported }) => imported.name === specifierName)
        ) {
          isOperatorAlreadyPresent = true;
          break;
        }
      }
      if (!isOperatorAlreadyPresent) {
        let { specifiers } = importedNodes.get('0').node;
        specifiers.push(Object.assign({}, specifiers[0]));
        specifiers[specifiers.length - 1].imported = specifierName;
        specifiers[specifiers.length - 1].local = null;
      }
    } else {
      root.find(j.Program).forEach((path) => {
        path
          .get('body')
          .value.unshift(
            j.importDeclaration(
              [j.importDefaultSpecifier(j.identifier(`{ ${specifierName} }`))],
              j.literal(sourceName)
            )
          );
      });
    }
  },
};
