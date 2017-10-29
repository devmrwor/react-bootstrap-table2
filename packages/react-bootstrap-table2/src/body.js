/* eslint react/prop-types: 0 */
/* eslint react/require-default-props: 0 */

import React from 'react';
import PropTypes from 'prop-types';

import _ from './utils';
import Row from './row';
import RowSection from './row-section';
import Const from './const';

const Body = (props) => {
  const {
    columns,
    data,
    keyField,
    isEmpty,
    noDataIndication,
    visibleColumnSize,
    cellEdit,
    selectRow,
    selectedRowKeys,
    rowStyle
  } = props;

  const {
    classes: selectedClasses,
    bgColor,
    nonSelectable
  } = selectRow;

  let content;

  if (isEmpty) {
    const indication = _.isFunction(noDataIndication) ? noDataIndication() : noDataIndication;
    content = <RowSection content={ indication } colSpan={ visibleColumnSize } />;
  } else {
    content = data.map((row, index) => {
      const key = _.get(row, keyField);
      const editable = !(cellEdit.mode !== Const.UNABLE_TO_CELL_EDIT &&
        cellEdit.nonEditableRows.indexOf(key) > -1);

      const selected = selectRow.mode !== Const.ROW_SELECT_DISABLED
        ? selectedRowKeys.includes(key)
        : null;

      let style = _.isFunction(rowStyle) ? rowStyle(row, index) : rowStyle;
      let classes;
      if (selected) {
        const selectedStyle = _.isFunction(selectRow.style)
          ? selectRow.style(row, index)
          : selectRow.style;
        style = {
          ...style,
          ...selectedStyle
        };
        classes = _.isFunction(selectedClasses) ? selectedClasses(row, index) : selectedClasses;

        if (bgColor) {
          style = style || {};
          style.backgroundColor = _.isFunction(bgColor) ? bgColor(row, index) : bgColor;
        }
      }

      const selectable = !nonSelectable || !nonSelectable.includes(key);

      return (
        <Row
          key={ key }
          row={ row }
          keyField={ keyField }
          rowIndex={ index }
          columns={ columns }
          cellEdit={ cellEdit }
          editable={ editable }
          selectable={ selectable }
          selected={ selected }
          selectRow={ selectRow }
          style={ style }
          className={ classes }
        />
      );
    });
  }

  return (
    <tbody>{ content }</tbody>
  );
};

Body.propTypes = {
  keyField: PropTypes.string.isRequired,
  data: PropTypes.array.isRequired,
  columns: PropTypes.array.isRequired,
  selectRow: PropTypes.object,
  selectedRowKeys: PropTypes.array
};

export default Body;
