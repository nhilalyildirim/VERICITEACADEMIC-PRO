import React, { useEffect } from 'react';

export const BillingPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  useEffect(() => {
    onBack();
  }, [onBack]);

  return null;
};
