let { checkNodeProps } = require('./check-node-props');

function checkAndOrOperator(opearatorName, node, computedProps, nodeProps) {
  let nodeTypes = ['CallExpression', 'MemberExpression'];
  if (node.type === 'LogicalExpression' && node.operator === opearatorName) {
    if (nodeTypes.includes(node.left.type) && nodeTypes.includes(node.right.type)) {
      return (
        checkNodeProps(node.left, computedProps, nodeProps) &&
        checkNodeProps(node.right, computedProps, nodeProps)
      );
    } else if (nodeTypes.includes(node.left.type) && node.right.type === 'LogicalExpression') {
      return (
        checkNodeProps(node.left, computedProps, nodeProps) &&
        checkAndOrOperator(node.right, computedProps)
      );
    } else if (nodeTypes.includes(node.right.type) && node.left.type === 'LogicalExpression') {
      return (
        checkNodeProps(node.right, computedProps, nodeProps) &&
        checkAndOrOperator(node.left, computedProps)
      );
    } else if (node.right.type === 'LogicalExpression' && node.left.type === 'LogicalExpression') {
      return (
        checkAndOrOperator(node.left, computedProps) && checkAndOrOperator(node.right, computedProps)
      );
    }
    return false;
  }
  return false;
}

module.exports = {
  checkAndOrOperator(opearatorName, node, computedProps, nodeProps) {
    return checkAndOrOperator(opearatorName, node, computedProps, nodeProps);
  },
};
