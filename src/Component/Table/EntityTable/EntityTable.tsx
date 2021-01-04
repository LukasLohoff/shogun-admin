import React, { useState } from 'react';

import { EditableCell } from '../../Table/EditableCell';

import Table, { ColumnsType, TableProps } from 'antd/lib/table';
import TableUtil from '../../../Util/TableUtil';
import { Form, Modal, Input, notification, Tooltip } from 'antd';

import {
  CheckCircleTwoTone,
  CloseCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  SyncOutlined
} from '@ant-design/icons';

import './EntityTable.less';
import { matchPath, useHistory, useLocation } from 'react-router-dom';
import BaseEntity from '../../../Model/BaseEntity';
import GenericService from '../../../Service/GenericService/GenericService';

export type EntityTableAction = 'edit' | 'delete';

export type EntityTableColumn = ColumnsType<BaseEntity> & {
  editable: boolean;
  dataIndex: string;
  title: string;
};

type OwnProps= {
  service: any;
  routePath: string;
  columns?: EntityTableColumn | EntityTableColumn[];
  actions?: EntityTableAction[];
  onRowClick?: (record: BaseEntity, event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  name: {
    singular: string;
    plural: string;
  };
};

export type EntityTableProps = OwnProps & TableProps<BaseEntity>;

const defaultColumns = [
  {
    title: 'Name',
    dataIndex: 'name',
    sorter: TableUtil.getSorter('name'),
    defaultSortOrder: 'ascend',
    editable: true,
    ...TableUtil.getColumnSearchProps('name')
  }
];

export const EntityTable: React.FC<EntityTableProps> = ({
  service,
  routePath,
  name,
  columns = defaultColumns,
  actions = [],
  onRowClick = (record) => history.push(`${routePath}/${record.id}`),
  ...passThroughProps
}) => {

  const entityService: GenericService<BaseEntity> = service;

  const history = useHistory();
  const location = useLocation();
  const match = matchPath<{entityId: string}>(location.pathname, {
    path: `${routePath}/:entityId`
  });
  const entityId = match?.params?.entityId;

  const [entities, setEntities] = useState<BaseEntity[]>();
  const [editingId, setEditingId] = useState('');
  const [loadingState, setLoadingState] = useState<'failed' | 'loading' | 'done'>();
  const [form] = Form.useForm();

  const fetchEntities = async () => {
    setLoadingState('loading');
    try {
      const fetchedEntities = await entityService.findAll();
      setEntities(fetchedEntities);
      setLoadingState('done');
    } catch (error) {
      setLoadingState('failed');
    }
  };

  if (!loadingState) {
    fetchEntities();
  }

  const isEditing = (record: BaseEntity) => record.id === editingId;

  const edit = (record: BaseEntity) => {
    form.setFieldsValue({
      ...record
    });
    setEditingId(record.id);
  };

  const onDeleteClick = (record) => {
    if (!record.id) {
      setEntities(entities.filter(r => r !== record));
      return;
    }

    let confirmName;
    Modal.confirm({
      cancelText: 'Abbrechen',
      title: `${name.singular} löschen`,
      content: (
        <div>
          <div>Die {name.singular} wird gelöscht!</div>
          <br />
          <div>Bitte geben sie zum Bestätigen den Namen ein:</div>
          <Input onChange={(e) => { confirmName = e.target.value; }} />
        </div>
      ),
      onOk: () => {
        if (confirmName === record.name) {
          entityService
            .delete(record.id)
            .then(() => {
              notification.info({
                message: `${name.singular} gelöscht`,
                description: `${name.singular} "${record.name}" wurde gelöscht`
              });
              fetchEntities();
            });
        }
      }
    });
  };

  const save = async (id: string) => {
    const row = (await form.validateFields()) as BaseEntity;
    const affectedEntity = entities.find(t => t.id === id);
    const updatedEntity = {
      ...affectedEntity,
      ...row
    };

    if (affectedEntity.id) {
      entityService
        .update(updatedEntity)
        .then(fetchEntities)
        .then(stopEditing);
    } else {
      entityService
        .add(updatedEntity)
        .then(fetchEntities)
        .then(stopEditing);
    }
  };

  const stopEditing = () => {
    setEditingId('');
  };

  const tableColumns = [
    ...columns,
    {
      title: (
        <Tooltip title="Neu laden">
          <SyncOutlined
            onClick={fetchEntities}
          />
        </Tooltip>
      ),
      className: 'operation-column',
      width: 100,
      dataIndex: 'operation',
      render: (_: any, record: BaseEntity) => {
        if (actions.includes('edit') && isEditing(record)) {
          return (
            <div className="actions">
              <Tooltip title="Speichern">
                <CheckCircleTwoTone
                  twoToneColor="#52c41a"
                  onClick={() => save(record.id)}
                  style={{ marginRight: 8 }}
                />
              </Tooltip>
              <Tooltip title="Abbrechen">
                <CloseCircleOutlined onClick={stopEditing} />
              </Tooltip>
            </div>
          );
        } else {
          return (
            <div className="actions">
              {
                actions.includes('edit') &&
                <Tooltip title="Bearbeiten">
                  <EditOutlined onClick={() => edit(record)} />
                </Tooltip>
              }
              {
                actions.includes('delete') &&
                <Tooltip title="Löschen">
                  <DeleteOutlined onClick={() => onDeleteClick(record)} />
                </Tooltip>
              }
            </div>
          );
        }
      }
    }
  ];

  return (
    <Form form={form} component={false}>
      <Table
        className="entity-table"
        rowSelection={{
          type: 'radio',
          columnWidth: 0,
          renderCell: () => '',
          selectedRowKeys: entityId ? [entityId.toString()] : []
        }}
        rowKey={(record)=> record.id.toString()}
        rowClassName={() => 'editable-row'}
        dataSource={entities}
        pagination={false}
        components={{
          body: {
            cell: EditableCell
          }
        }}
        onRow={(record, rowIndex) => {
          return {
            onClick: (event) => onRowClick(record, event)
          };
        }}
        columns={
          tableColumns.map((col: EntityTableColumn) => {
            if (!col.editable) {
              return col;
            }
            return {
              ...col,
              onCell: record => ({
                record,
                dataType: 'text',
                editing: isEditing(record),
                dataIndex: col.dataIndex,
                title: col.title
              })
            };
          })
        }
        {...passThroughProps}
      />
    </Form>
  );
};

export default EntityTableColumn;
