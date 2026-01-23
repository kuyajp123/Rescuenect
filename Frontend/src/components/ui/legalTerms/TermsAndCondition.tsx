import htmlContent from '@/assets/legalTerms/TermsAndCondition.html?raw';
import { useEffect } from 'react';

const TermsAndCondition = () => {
  useEffect(() => {
    document.title = 'Terms and Conditions';
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
};

export default TermsAndCondition;
