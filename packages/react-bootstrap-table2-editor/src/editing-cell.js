/* eslint react/prop-types: 0 */
/* eslint no-return-assign: 0 */
/* eslint class-methods-use-this: 0 */
/* eslint jsx-a11y/no-noninteractive-element-interactions: 0 */
import React, { Component } from 'react';
import cs from 'classnames';
import PropTypes from 'prop-types';

import DropdownEditor from './dropdown-editor';
import TextAreaEditor from './textarea-editor';
import CheckBoxEditor from './checkbox-editor';
import DateEditor from './date-editor';
import TextEditor from './text-editor';
import EditorIndicator from './editor-indicator';
import { TIME_TO_CLOSE_MESSAGE, EDITTYPE } from './const';

export default _ =>
  class EditingCell extends Component {
    static propTypes = {
      row: PropTypes.object.isRequired,
      rowIndex: PropTypes.number.isRequired,
      column: PropTypes.object.isRequired,
      columnIndex: PropTypes.number.isRequired,
      onUpdate: PropTypes.func.isRequired,
      onEscape: PropTypes.func.isRequired,
      timeToCloseMessage: PropTypes.number,
      className: PropTypes.string,
      style: PropTypes.object
    }

    static defaultProps = {
      timeToCloseMessage: TIME_TO_CLOSE_MESSAGE,
      className: null,
      style: {}
    }

    constructor(props) {
      super(props);
      this.indicatorTimer = null;
      this.clearTimer = this.clearTimer.bind(this);
      this.handleBlur = this.handleBlur.bind(this);
      this.handleClick = this.handleClick.bind(this);
      this.handleKeyDown = this.handleKeyDown.bind(this);
      this.beforeComplete = this.beforeComplete.bind(this);
      this.state = {
        invalidMessage: null
      };
    }

    componentWillReceiveProps({ message }) {
      if (_.isDefined(message)) {
        this.createTimer();
        this.setState(() => ({
          invalidMessage: message
        }));
      }
    }

    componentWillUnmount() {
      this.clearTimer();
    }

    clearTimer() {
      if (this.indicatorTimer) {
        clearTimeout(this.indicatorTimer);
      }
    }

    createTimer() {
      this.clearTimer();
      const { timeToCloseMessage, onErrorMessageDisappear } = this.props;
      this.indicatorTimer = _.sleep(() => {
        this.setState(() => ({
          invalidMessage: null
        }));
        if (_.isFunction(onErrorMessageDisappear)) onErrorMessageDisappear();
      }, timeToCloseMessage);
    }

    beforeComplete(newValue) {
      const { onUpdate, row, column } = this.props;
      if (_.isFunction(column.validator)) {
        const validateForm = column.validator(newValue, row, column);
        if (_.isObject(validateForm) && !validateForm.valid) {
          this.setState(() => ({
            invalidMessage: validateForm.message
          }));
          this.createTimer();
          return;
        }
      }
      onUpdate(row, column, newValue);
    }

    handleBlur() {
      const { onEscape, blurToSave } = this.props;
      if (blurToSave) {
        this.beforeComplete(this.editor.getValue());
      } else {
        onEscape();
      }
    }

    handleKeyDown(e) {
      const { onEscape } = this.props;
      if (e.keyCode === 27) { // ESC
        onEscape();
      } else if (e.keyCode === 13) { // ENTER
        this.beforeComplete(this.editor.getValue());
      }
    }

    handleClick(e) {
      if (e.target.tagName !== 'TD') {
        // To avoid the row selection event be triggered,
        // When user define selectRow.clickToSelect and selectRow.clickToEdit
        // We shouldn't trigger selection event even if user click on the cell editor(input)
        e.stopPropagation();
      }
    }

    render() {
      let editor;
      const { row, column, className, style, rowIndex, columnIndex } = this.props;
      const { dataField } = column;

      const value = _.get(row, dataField);
      const hasError = _.isDefined(this.state.invalidMessage);

      let customEditorClass = column.editorClasses || '';
      if (_.isFunction(column.editorClasses)) {
        customEditorClass = column.editorClasses(value, row, rowIndex, columnIndex);
      }

      let editorStyle = column.editorStyle || {};
      if (_.isFunction(column.editorStyle)) {
        editorStyle = column.editorStyle(value, row, rowIndex, columnIndex);
      }

      const editorClass = cs({
        animated: hasError,
        shake: hasError
      }, customEditorClass);

      let editorProps = {
        ref: node => this.editor = node,
        defaultValue: value,
        style: editorStyle,
        className: editorClass,
        onKeyDown: this.handleKeyDown,
        onBlur: this.handleBlur
      };

      const isDefaultEditorDefined = _.isObject(column.editor);

      if (isDefaultEditorDefined) {
        editorProps = {
          ...editorProps,
          ...column.editor
        };
      } else if (_.isFunction(column.editorRenderer)) {
        editorProps = {
          ...editorProps,
          onUpdate: this.beforeComplete
        };
      }

      if (_.isFunction(column.editorRenderer)) {
        editor = column.editorRenderer(editorProps, value, row, column, rowIndex, columnIndex);
      } else if (isDefaultEditorDefined && column.editor.type === EDITTYPE.SELECT) {
        editor = <DropdownEditor { ...editorProps } />;
      } else if (isDefaultEditorDefined && column.editor.type === EDITTYPE.TEXTAREA) {
        editor = <TextAreaEditor { ...editorProps } />;
      } else if (isDefaultEditorDefined && column.editor.type === EDITTYPE.CHECKBOX) {
        editor = <CheckBoxEditor { ...editorProps } />;
      } else if (isDefaultEditorDefined && column.editor.type === EDITTYPE.DATE) {
        editor = <DateEditor { ...editorProps } />;
      } else {
        editor = <TextEditor { ...editorProps } />;
      }

      return (
        <td
          className={ cs('react-bootstrap-table-editing-cell', className) }
          style={ style }
          onClick={ this.handleClick }
        >
          { editor }
          { hasError ? <EditorIndicator invalidMessage={ this.state.invalidMessage } /> : null }
        </td>
      );
    }
  };
