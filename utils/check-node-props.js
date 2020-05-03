module.exports = {
  checkNodeProps(node, computedProps, nodeProps) {
    if (
      node.type === 'CallExpression' &&
      node.arguments &&
      node.arguments.length === 1 &&
      node.arguments[0].value
    ) {
      nodeProps.push(node.arguments[0].value);
      return (
        node.callee &&
        node.callee.object &&
        node.callee.object.type === 'ThisExpression' &&
        node.callee.property &&
        node.callee.property.name === 'get' &&
        computedProps.includes(node.arguments[0].value)
      );
    } else if (node.type === 'MemberExpression' && node.property && node.property.name) {
      nodeProps.push(node.property.name);
      return (
        node.object &&
        node.object.type === 'ThisExpression' &&
        computedProps.includes(node.property.name)
      );
    }
    return false;
  },
};
