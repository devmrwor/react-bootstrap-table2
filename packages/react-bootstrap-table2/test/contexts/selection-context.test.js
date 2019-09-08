import 'jsdom-global/register';
import React from 'react';
import { shallow } from 'enzyme';

import dataOperator from '../../src/store/operators';
import BootstrapTable from '../../src/bootstrap-table';
import SelectionContext from '../../src/contexts/selection-context';

describe('DataContext', () => {
  let wrapper;

  const data = [{
    id: 1,
    name: 'A'
  }, {
    id: 2,
    name: 'B'
  }, {
    id: 3,
    name: 'B'
  }];

  const keyField = 'id';

  const columns = [{
    dataField: 'id',
    text: 'ID'
  }, {
    dataField: 'name',
    text: 'Name'
  }];

  const mockBase = jest.fn((props => (
    <BootstrapTable
      data={ data }
      columns={ columns }
      keyField={ keyField }
      { ...props }
    />
  )));

  const defaultSelectRow = {
    mode: 'checkbox'
  };

  function shallowContext(selectRow = defaultSelectRow) {
    return (
      <SelectionContext.Provider
        data={ data }
        keyField={ keyField }
        selectRow={ selectRow }
      >
        <SelectionContext.Consumer>
          {
            selectionProps => mockBase(selectionProps)
          }
        </SelectionContext.Consumer>
      </SelectionContext.Provider>
    );
  }

  describe('default render', () => {
    beforeEach(() => {
      wrapper = shallow(shallowContext());
      wrapper.render();
    });

    it('should have correct Provider property after calling createSelectionContext', () => {
      expect(SelectionContext.Provider).toBeDefined();
    });

    it('should have correct Consumer property after calling createSelectionContext', () => {
      expect(SelectionContext.Consumer).toBeDefined();
    });

    it('should have correct this.selected', () => {
      expect(wrapper.instance().selected).toEqual([]);
    });

    it('should pass correct sort props to children element', () => {
      expect(wrapper.length).toBe(1);
      expect(mockBase).toHaveBeenCalledWith({
        ...defaultSelectRow,
        selected: wrapper.instance().selected,
        onRowSelect: wrapper.instance().handleRowSelect,
        onAllRowsSelect: wrapper.instance().handleAllRowsSelect,
        allRowsNotSelected: true,
        allRowsSelected: false,
        checkedStatus: 'unchecked'
      });
    });
  });

  describe('componentWillReceiveProps', () => {
    const newSelectRow = {
      ...defaultSelectRow,
      selected: [1]
    };

    beforeEach(() => {
      wrapper = shallow(shallowContext());
      wrapper.instance().UNSAFE_componentWillReceiveProps({
        selectRow: newSelectRow
      });
    });

    it('should have correct this.selected', () => {
      expect(wrapper.instance().selected).toEqual(newSelectRow.selected);
    });

    describe('if nextProps.selectRow is not existing', () => {
      const defaultSelected = [1];
      beforeEach(() => {
        wrapper = shallow(shallowContext({
          ...defaultSelectRow,
          selected: defaultSelected
        }));
        wrapper.instance().UNSAFE_componentWillReceiveProps({
          selectRow: defaultSelectRow
        });
      });

      it('should keep origin this.selected', () => {
        expect(wrapper.instance().selected).toEqual(defaultSelected);
      });
    });

    describe('if nextProps.selectRow is not existing', () => {
      beforeEach(() => {
        wrapper = shallow(shallowContext());
        wrapper.instance().UNSAFE_componentWillReceiveProps({});
      });

      it('should not set this.selected', () => {
        expect(wrapper.instance().selected).toEqual([]);
      });
    });
  });

  describe('when selectRow.selected prop is defined', () => {
    let selectRow;

    beforeEach(() => {
      selectRow = {
        ...defaultSelectRow,
        selected: [1]
      };
      wrapper = shallow(shallowContext(selectRow));
    });

    it('should have correct this.selected', () => {
      expect(wrapper.instance().selected).toEqual(selectRow.selected);
    });
  });

  describe('handleRowSelect', () => {
    const rowIndex = 1;
    const firstSelectedRow = data[0][keyField];
    const secondSelectedRow = data[1][keyField];

    describe('when selectRow.mode is \'radio\'', () => {
      beforeEach(() => {
        const selectRow = { mode: 'radio' };
        wrapper = shallow(shallowContext(selectRow));
      });

      it('should set this.selected correctly', () => {
        wrapper.instance().handleRowSelect(firstSelectedRow, true, rowIndex);
        expect(wrapper.instance().selected).toEqual([firstSelectedRow]);

        wrapper.instance().handleRowSelect(secondSelectedRow, true, rowIndex);
        expect(wrapper.instance().selected).toEqual([secondSelectedRow]);
      });
    });

    describe('when selectRow.mode is \'checkbox\'', () => {
      beforeEach(() => {
        wrapper = shallow(shallowContext());
      });

      it('should set this.selected correctly', () => {
        wrapper.instance().handleRowSelect(firstSelectedRow, true, rowIndex);
        expect(wrapper.instance().selected).toEqual(expect.arrayContaining([firstSelectedRow]));

        wrapper.instance().handleRowSelect(secondSelectedRow, true, rowIndex);
        expect(wrapper.instance().selected)
          .toEqual(expect.arrayContaining([firstSelectedRow, secondSelectedRow]));

        wrapper.instance().handleRowSelect(firstSelectedRow, false, rowIndex);
        expect(wrapper.instance().selected).toEqual(expect.arrayContaining([secondSelectedRow]));

        wrapper.instance().handleRowSelect(secondSelectedRow, false, rowIndex);
        expect(wrapper.instance().selected).toEqual([]);
      });
    });

    describe('when selectRow.onSelect is defined', () => {
      const onSelect = jest.fn();
      beforeEach(() => {
        wrapper = shallow(shallowContext({
          ...defaultSelectRow,
          onSelect
        }));
      });

      it('call selectRow.onSelect correctly', () => {
        const e = { target: {} };
        const row = dataOperator.getRowByRowId(data, keyField, firstSelectedRow);
        wrapper.instance().handleRowSelect(firstSelectedRow, true, rowIndex, e);
        expect(onSelect).toHaveBeenCalledWith(row, true, rowIndex, e);
      });
    });
  });

  describe('handleAllRowsSelect', () => {
    const e = { target: {} };

    describe('when isUnSelect argument is false', () => {
      beforeEach(() => {
        wrapper = shallow(shallowContext());
        wrapper.instance().handleAllRowsSelect(e, false);
      });

      it('should set this.selected correctly', () => {
        expect(wrapper.instance().selected).toEqual(data.map(d => d[keyField]));
      });

      describe('when selectRow.onSelectAll is defined', () => {
        const onSelectAll = jest.fn();
        beforeEach(() => {
          wrapper = shallow(shallowContext({
            ...defaultSelectRow,
            onSelectAll
          }));
          wrapper.instance().handleAllRowsSelect(e, false);
        });

        it('should call selectRow.onSelectAll correctly', () => {
          expect(onSelectAll).toHaveBeenCalledWith(
            true,
            dataOperator.getSelectedRows(data, keyField, wrapper.instance().selected),
            e
          );
        });
      });
    });

    describe('when isUnSelect argument is true', () => {
      beforeEach(() => {
        wrapper = shallow(shallowContext({
          ...defaultSelectRow,
          selected: data.map(d => d[keyField])
        }));
        wrapper.instance().handleAllRowsSelect(e, true);
      });

      it('should set this.selected correctly', () => {
        expect(wrapper.instance().selected).toEqual([]);
      });

      describe('when selectRow.onSelectAll is defined', () => {
        const onSelectAll = jest.fn();
        beforeEach(() => {
          wrapper = shallow(shallowContext({
            ...defaultSelectRow,
            selected: data.map(d => d[keyField]),
            onSelectAll
          }));
          wrapper.instance().handleAllRowsSelect(e, true);
        });

        it('should call selectRow.onSelectAll correctly', () => {
          expect(onSelectAll).toHaveBeenCalledWith(
            false,
            dataOperator.getSelectedRows(data, keyField, data.map(d => d[keyField])),
            e
          );
        });
      });
    });
  });
});
