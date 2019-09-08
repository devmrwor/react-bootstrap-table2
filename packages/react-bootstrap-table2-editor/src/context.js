/* eslint disable-next-line: 0 */
/* eslint react/prop-types: 0 */
/* eslint react/require-default-props: 0 */
/* eslint camelcase: 0 */
/* eslint react/no-unused-prop-types: 0 */
import React from 'react';
import PropTypes from 'prop-types';
import { CLICK_TO_CELL_EDIT, DBCLICK_TO_CELL_EDIT } from './const';

const CellEditContext = React.createContext();

export default (
  _,
  dataOperator,
  isRemoteCellEdit,
  handleCellChange
) => {
  class CellEditProvider extends React.Component {
    static propTypes = {
      data: PropTypes.array.isRequired,
      selectRow: PropTypes.object,
      options: PropTypes.shape({
        mode: PropTypes.oneOf([CLICK_TO_CELL_EDIT, DBCLICK_TO_CELL_EDIT]).isRequired,
        onErrorMessageDisappear: PropTypes.func,
        blurToSave: PropTypes.bool,
        beforeSaveCell: PropTypes.func,
        afterSaveCell: PropTypes.func,
        onStartEdit: PropTypes.func,
        nonEditableRows: PropTypes.func,
        timeToCloseMessage: PropTypes.number,
        errorMessage: PropTypes.any
      })
    }

    constructor(props) {
      super(props);
      this.doUpdate = this.doUpdate.bind(this);
      this.startEditing = this.startEditing.bind(this);
      this.escapeEditing = this.escapeEditing.bind(this);
      this.completeEditing = this.completeEditing.bind(this);
      this.handleCellUpdate = this.handleCellUpdate.bind(this);
      this.state = {
        ridx: null,
        cidx: null,
        message: null
      };
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
      if (nextProps.cellEdit && isRemoteCellEdit()) {
        if (nextProps.cellEdit.options.errorMessage) {
          this.setState(() => ({
            message: nextProps.cellEdit.options.errorMessage
          }));
        } else {
          this.escapeEditing();
        }
      }
    }

    handleCellUpdate(row, column, newValue) {
      const newValueWithType = dataOperator.typeConvert(column.type, newValue);
      const { cellEdit } = this.props;
      const { beforeSaveCell } = cellEdit.options;
      const oldValue = _.get(row, column.dataField);
      const beforeSaveCellDone = (result = true) => {
        if (result) {
          this.doUpdate(row, column, newValueWithType);
        } else {
          this.escapeEditing();
        }
      };
      if (_.isFunction(beforeSaveCell)) {
        const result = beforeSaveCell(
          oldValue,
          newValueWithType,
          row,
          column,
          beforeSaveCellDone
        );
        if (_.isObject(result) && result.async) {
          return;
        }
      }
      this.doUpdate(row, column, newValueWithType);
    }

    doUpdate(row, column, newValue) {
      const { keyField, cellEdit, data } = this.props;
      const { afterSaveCell } = cellEdit.options;
      const rowId = _.get(row, keyField);
      const oldValue = _.get(row, column.dataField);
      if (isRemoteCellEdit()) {
        handleCellChange(rowId, column.dataField, newValue);
      } else {
        dataOperator.editCell(data, keyField, rowId, column.dataField, newValue);
        if (_.isFunction(afterSaveCell)) afterSaveCell(oldValue, newValue, row, column);
        this.completeEditing();
      }
    }

    completeEditing() {
      this.setState(() => ({
        ridx: null,
        cidx: null,
        message: null
      }));
    }

    startEditing(ridx, cidx) {
      const editing = () => {
        this.setState(() => ({
          ridx,
          cidx
        }));
      };

      const { selectRow } = this.props;
      if (!selectRow || (selectRow.clickToEdit || !selectRow.clickToSelect)) editing();
    }

    escapeEditing() {
      this.setState(() => ({
        ridx: null,
        cidx: null
      }));
    }

    render() {
      const {
        cellEdit: {
          options: { nonEditableRows, errorMessage, ...optionsRest },
          ...cellEditRest
        }
      } = this.props;

      const newCellEdit = {
        ...optionsRest,
        ...cellEditRest,
        ...this.state,
        nonEditableRows: _.isDefined(nonEditableRows) ? nonEditableRows() : [],
        onStart: this.startEditing,
        onEscape: this.escapeEditing,
        onUpdate: this.handleCellUpdate
      };

      return (
        <CellEditContext.Provider
          value={ { ...newCellEdit } }
        >
          { this.props.children }
        </CellEditContext.Provider>
      );
    }
  }
  return {
    Provider: CellEditProvider
  };
};

export const Consumer = CellEditContext.Consumer;
