
import React, { useState } from "react";
import {
  FolderSimpleIcon,
  VideoCameraIcon,
  EnvelopeSimpleIcon,
  PaperPlaneTiltIcon,
  GaugeIcon,
  ShieldIcon,
  SparkleIcon,
} from '@phosphor-icons/react';
import { SuiteLauncher, SuiteLauncherProps } from '@internxt/ui';
import { Service } from '@internxt/sdk/dist/drive/payments/types/tiers';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { getUserTier } from '../../../general/store/meeting/selectors';
import desktopService from '../../../services/desktop.service';
import UpgradeTierModal from "../../../general/components/UpgradeTierModal";

interface SuitePopoverProps {
  className?: string;
}

export default function SuitePopover({ className = '' }: Readonly<SuitePopoverProps>): JSX.Element {
  const { t: translate } = useTranslation();
  const userTier = useSelector(getUserTier);
  const dispatch = useDispatch();
  const [showUpgradeTierModal, setShowUpgradeTierModal] = useState(false);
  const [upgradeModalInfo, setUpgradeModalInfo] = useState({ title: '', description: '' });

  const openSuite = (suite: {
    enabled: boolean;
    onOpenSuite: () => void;
    upgradeTitle: string;
    upgradeDescription: string;
  }) => {
    if (suite.enabled) {
      suite.onOpenSuite();
    } else {
      setUpgradeModalInfo({
        title: suite.upgradeTitle,
        description: suite.upgradeDescription,
      });
      setShowUpgradeTierModal(true);
    }
  };

  const suiteArray: SuiteLauncherProps['suiteArray'] = [
    {
      icon: <FolderSimpleIcon />,
      title: 'Drive',
      onClick: () => {
        window.open('https://drive.internxt.com', '_blank', 'noopener');
      },
    },
    {
      icon: <VideoCameraIcon />,
      title: 'Meet',
      onClick: () => {
        window.open('https://meet.internxt.com', '_self', 'noopener');
      },
      isMain: true,
    },
    {
      icon: <EnvelopeSimpleIcon />,
      title: 'Mail',
      onClick: () => { },
      availableSoon: true,
      isLocked: !userTier?.featuresPerService?.[Service.Mail].enabled,
    },
    {
      icon: <PaperPlaneTiltIcon />,
      title: 'Send',
      onClick: () => {
        window.open('https://send.internxt.com', '_blank', 'noopener');
      },
    },
    {
      icon: <GaugeIcon />,
      title: 'VPN',
      onClick: () =>
        openSuite({
          enabled: userTier?.featuresPerService?.[Service.Vpn].enabled ?? false,
          onOpenSuite: () =>
            window.open(
              'https://chromewebstore.google.com/detail/internxt-vpn-free-encrypt/dpggmcodlahmljkhlmpgpdcffdaoccni',
              '_blank',
              'noopener',
            ),
          upgradeTitle: translate('upgradePlanDialog.vpn.title'),
          upgradeDescription: translate('upgradePlanDialog.vpn.description'),
        }),
      isLocked: !userTier?.featuresPerService?.[Service.Vpn].enabled,
    },
    {
      icon: <ShieldIcon />,
      title: 'Antivirus',
      onClick: () =>
        openSuite({
          enabled: userTier?.featuresPerService?.[Service.Antivirus].enabled ?? false,
          onOpenSuite: () => {
            desktopService.openDownloadAppUrl(dispatch, translate);
          },
          upgradeTitle: translate('upgradePlanDialog.antivirus.title'),
          upgradeDescription: translate('upgradePlanDialog.antivirus.description'),
        }),
      isLocked: !userTier?.featuresPerService?.[Service.Antivirus].enabled,
    },
    {
      icon: <SparkleIcon />,
      title: 'Cleaner',
      onClick: () =>
        openSuite({
          enabled: userTier?.featuresPerService?.[Service.Cleaner].enabled ?? false,
          onOpenSuite: () => {
            desktopService.openDownloadAppUrl(dispatch, translate);
          },
          upgradeTitle: translate('upgradePlanDialog.cleaner.title'),
          upgradeDescription: translate('upgradePlanDialog.cleaner.description'),
        }),
      isLocked: !userTier?.featuresPerService?.[Service.Cleaner].enabled,
    },
  ];

  return (
    <>
      <UpgradeTierModal
        translate={translate}
        onClose={() => setShowUpgradeTierModal(false)}
        show={showUpgradeTierModal}
        info={upgradeModalInfo}
      />

      <SuiteLauncher
        className={className}
        suiteArray={suiteArray}
        soonText={translate('upgradePlanDialog.soonBadge')}
      />
    </>
  );
}
