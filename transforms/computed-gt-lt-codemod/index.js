const { getParser } = require('codemod-cli').jscodeshift;
let { changeImportDeclartion } = require('../../utils/change-import-declaration');

module.exports = function transformer(file, api) {
  const j = getParser(api);
  let root = j(file.source);
  let changedNodes = [];

  function isComputedSingleProp(p, operatorName) {
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
            returnNode.argument.operator === operatorName
          ) {
            returnNode = returnNode.argument;
            if (returnNode.right.type === 'Literal' || returnNode.right.type === 'StringLiteral') {
              let computedProp = p.value.arguments[0].value;
              if (returnNode.left.type === 'CallExpression') {
                let cond =
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
                  returnNode.left.object &&
                  returnNode.left.object.type === 'ThisExpression' &&
                  returnNode.left.property &&
                  returnNode.left.property.name === computedProp
                );
              }
              return false;
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

  function addChangedNodes(node) {
    if (!changedNodes.includes(node)) {
      changedNodes.push(node);
    }
  }

  root
    .find(j.CallExpression)
    .filter((p) => isComputedSingleProp(p, '>'))
    .forEach((p) => {
      addChangedNodes('gt');
      let rightValue = p.value.arguments[1].body.body[0].argument.right.value;
      rightValue = typeof rightValue === 'string' ? `'${rightValue}'` : rightValue;
      j(p).replaceWith(`gt('${p.value.arguments[0].value}', ${rightValue})`);
    });
  root
    .find(j.CallExpression)
    .filter((p) => isComputedSingleProp(p, '<'))
    .forEach((p) => {
      addChangedNodes('lt');
      let rightValue = p.value.arguments[1].body.body[0].argument.right.value;
      rightValue = typeof rightValue === 'string' ? `'${rightValue}'` : rightValue;
      j(p).replaceWith(`lt('${p.value.arguments[0].value}', ${rightValue})`);
    });
  root
    .find(j.CallExpression)
    .filter((p) => isComputedSingleProp(p, '<='))
    .forEach((p) => {
      addChangedNodes('lte');
      let rightValue = p.value.arguments[1].body.body[0].argument.right.value;
      rightValue = typeof rightValue === 'string' ? `'${rightValue}'` : rightValue;
      j(p).replaceWith(`lte('${p.value.arguments[0].value}', ${rightValue})`);
    });
  root
    .find(j.CallExpression)
    .filter((p) => isComputedSingleProp(p, '>='))
    .forEach((p) => {
      addChangedNodes('gte');
      let rightValue = p.value.arguments[1].body.body[0].argument.right.value;
      rightValue = typeof rightValue === 'string' ? `'${rightValue}'` : rightValue;
      j(p).replaceWith(`gte('${p.value.arguments[0].value}', ${rightValue})`);
    });

  changedNodes.forEach((node) => changeImportDeclartion(j, root, '@ember/object/computed', node));

  return root.toSource({ quote: 'single' });
};
