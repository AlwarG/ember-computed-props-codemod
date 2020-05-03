const { getParser } = require('codemod-cli').jscodeshift;
let { changeImportDeclartion } = require('../../utils/change-import-declaration');

module.exports = function transformer(file, api) {
  const j = getParser(api);
  let root = j(file.source);
  let isNodeChanged = false;

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
          if (
            returnNode.argument.type === 'BinaryExpression' &&
            returnNode.argument.operator === '==='
          ) {
            returnNode = returnNode.argument;
            let computedProp = p.value.arguments[0].value;
            if (returnNode.left.type === 'CallExpression') {
              let cond =
                (returnNode.right.type === 'Literal' ||
                  returnNode.right.type === 'StringLiteral') &&
                returnNode.left.callee &&
                returnNode.left.callee.object &&
                returnNode.left.callee.object.type === 'ThisExpression' &&
                returnNode.left.callee.property &&
                returnNode.left.callee.property.name === 'get' &&
                returnNode.left.arguments &&
                returnNode.left.arguments.length === 1 &&
                returnNode.left.arguments[0].value === computedProp;
              return cond;
            } else if (returnNode.left.type === 'MemberExpression') {
              return (
                (returnNode.right.type === 'Literal' ||
                  returnNode.right.type === 'StringLiteral') &&
                returnNode.left.object &&
                returnNode.left.object.type === 'ThisExpression' &&
                returnNode.left.property &&
                returnNode.left.property.name === computedProp
              );
            }
            return false;
          }
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
      let rightValue = p.value.arguments[1].body.body[0].argument.right.value;
      rightValue = typeof rightValue === 'string' ? `'${rightValue}'` : rightValue;
      j(p).replaceWith(`equal('${p.value.arguments[0].value}', ${rightValue})`);
    });
  if (isNodeChanged) {
    changeImportDeclartion(j, root, '@ember/object/computed', 'equal');
  }
  return root.toSource();
};
