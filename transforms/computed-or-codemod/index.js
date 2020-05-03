const { getParser } = require('codemod-cli').jscodeshift;
let { changeImportDeclartion } = require('../../utils/change-import-declaration');
let { checkAndOrOperator } = require('../../utils/check-and-or-operator');

module.exports = function transformer(file, api) {
  const j = getParser(api);
  let root = j(file.source);
  let nodeProps = [];
  let isNodeChanged = false;

  function isComputedWithProps(p) {
    nodeProps = [];
    if (
      p.value.callee &&
      p.value.callee.name === 'computed' &&
      p.value.arguments &&
      p.value.arguments.length
    ) {
      let lastArgPos = p.value.arguments.length - 1;
      if (
        p.value.arguments[lastArgPos].body &&
        p.value.arguments[lastArgPos].body.body &&
        p.value.arguments[lastArgPos].body.body.length === 1
      ) {
        let returnNode = p.value.arguments[lastArgPos].body.body[0];
        if (returnNode && returnNode.argument) {
          let computedProps = p.value.arguments.map(({ value }) => value);
          computedProps.pop();
          return (
            checkAndOrOperator('||', returnNode.argument, computedProps, nodeProps) &&
            [...new Set(nodeProps)].length === computedProps.length
          );
        }
        return false;
      }
      return false;
    }
    return false;
  }

  root
    .find(j.CallExpression)
    .filter((p) => isComputedWithProps(p))
    .forEach((p) => {
      isNodeChanged = true;
      p.get('arguments').pop();
      p.value.callee.name = 'or';
    });
  if (isNodeChanged) {
    changeImportDeclartion(j, root, '@ember/object/computed', 'or');
  }
  return root.toSource({ quote: 'single' });
};
