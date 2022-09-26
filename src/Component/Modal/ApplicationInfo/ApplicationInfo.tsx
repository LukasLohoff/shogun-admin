import React from 'react';

import {
  Modal,
  Statistic
} from 'antd';

import { ModalProps } from 'antd/lib/modal';

import { useRecoilState } from 'recoil';

import { appInfoAtom, shogunInfoModalVisibleAtom } from '../../../State/atoms';

import {
    useClientVersion
} from '../../../Hooks/useClientVersion';

import defaultLogo from '../../../../assets/img/shogun_logo.png';

import './ApplicationInfo.less';

export interface ApplicationInfoProps extends ModalProps {}

export const ApplicationInfo: React.FC<ApplicationInfoProps> = ({
  ...passThroughProps
}) => {

  const [isVisible, setVisible] = useRecoilState(shogunInfoModalVisibleAtom);
  const [appInfo] = useRecoilState(appInfoAtom);

  const toggleVisibility = () => {
    setVisible(!isVisible);
  };

  return (
    <Modal
      className="application-info-modal"
      title="SHOGun Admin info"
      centered={true}
      visible={isVisible}
      onOk={toggleVisibility}
      onCancel={toggleVisibility}
      footer={null}
      {...passThroughProps}
    >
      <img
        className="shogun-logo"
        src={defaultLogo}
      />
      <Statistic
        title="Admin Version"
        value={useClientVersion()}
      />
      <Statistic
        title="SHOGun Version"
        value={appInfo.version}
      />
      <Statistic
        title="Build Zeit"
        value={appInfo.buildTime}
      />
    </Modal>
  );
};

export default ApplicationInfo;
