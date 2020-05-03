const { getParser } = require('codemod-cli').jscodeshift;
let { changeImportDeclartion } = require('../../utils/change-import-declaration');

module.exports = function transformer(file, api) {
  const j = getParser(api);
  let root = j(file.source);
  let isNodeChanged = false;

  // resourceType: computed('selectedTxnFilter.resourceType', function() {
  //   return this.get('selectedTxnFilter.resourceType');
  // }),

  // transforms into
  // resourceType: alias('selectedTxnFilter.resourceType'),

  // resourceType: computed('selectedTxnFilter', function() {
  //   return this.selectedTxnFilter;
  // }),

  // transforms into
  // resourceType: alias('selectedTxnFilter'),

  function isComputedSingleProp(p) {
    if (
      p.value.callee &&
      p.value.callee.name === 'computed' &&
      p.value.arguments &&
      p.value.arguments.length === 2
    ) {
      if (
        p.value.arguments[1].body &&
        p.value.arguments[1].body.body &&
        p.value.arguments[1].body.body &&
        p.value.arguments[1].body.body.length === 1
      ) {
        let returnNode = p.value.arguments[1].body.body[0];
        if (returnNode && returnNode.argument) {
          let computedProp = p.value.arguments[0].value;
          if (returnNode.argument.type === 'CallExpression') {
            return (
              returnNode.argument.callee &&
              returnNode.argument.callee.object &&
              returnNode.argument.callee.object.type === 'ThisExpression' &&
              returnNode.argument.callee.property &&
              returnNode.argument.callee.property.name === 'get' &&
              returnNode.argument.arguments &&
              returnNode.argument.arguments.length === 1 &&
              returnNode.argument.arguments[0].value === computedProp
            );
          } else if (returnNode.argument.type === 'MemberExpression') {
            return (
              returnNode.argument.object &&
              returnNode.argument.object.type === 'ThisExpression' &&
              returnNode.argument.property &&
              returnNode.argument.property.name === computedProp
            );
          }
          return false;
        }
        return false;
      }
      return false;
    }
    return false;
  }
  root
    .find(j.CallExpression)
    .filter((p) => isComputedSingleProp(p))
    .forEach((p) => {
      isNodeChanged = true;
      j(p).replaceWith(`alias('${p.value.arguments[0].value}')`);
    });
  if (isNodeChanged) {
    changeImportDeclartion(j, root, '@ember/object/computed', 'alias');
  }
  return root.toSource();
};
