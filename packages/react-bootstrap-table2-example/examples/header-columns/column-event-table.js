/* eslint no-unused-vars: 0 */
/* eslint no-alert: 0 */
import React from 'react';

import { BootstrapTableful } from 'react-bootstrap-table2';
import Code from 'components/common/code-block';
import { productsGenerator } from 'utils/common';

const products = productsGenerator();

const columns = [{
  dataField: 'id',
  text: 'Product ID',
  headerEvents: {
    onClick: () => alert('Click on Product ID header column')
  }
}, {
  dataField: 'name',
  text: 'Product Name'
}, {
  dataField: 'price',
  text: 'Product Price'
}];

const sourceCode = `\
const columns = [{
  dataField: 'id',
  text: 'Product ID',
  events: {
    onClick: () => alert('Click on Product ID header column')
  }
}, {
  dataField: 'name',
  text: 'Product Name'
}, {
  dataField: 'price',
  text: 'Product Price'
}];

<BootstrapTableful keyField='id' data={ products } columns={ columns } />
`;

export default () => (
  <div>
    <h3>Try to Click on Product ID header column</h3>
    <BootstrapTableful keyField="id" data={ products } columns={ columns } />
    <Code>{ sourceCode }</Code>
  </div>
);
