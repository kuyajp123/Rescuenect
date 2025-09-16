import { create } from "zustand";
import { StatusForm } from '@/types/components';

type StatusFormStore = {
    formData: StatusForm;
    setFormData: (data: Partial<StatusForm>) => void;
    resetFormData: () => void;
}

export const useStatusFormStore = create<StatusFormStore>((set) => ({
    formData: {
        firstName: '',
        lastName: '',
        statusType: '',
        phoneNumber: '',
        lat: null,
        lng: null,
        loc: null,
        image: '',
        note: '',
        shareLocation: true,
        shareContact: true,
    },
    setFormData: (data) => set((state) => ({
        formData: { ...state.formData, ...data }
    })),
    resetFormData: () => set({
        formData: {
            firstName: '',
            lastName: '',
            statusType: '',
            phoneNumber: '',
            lat: null,
            lng: null,
            loc: null,
            image: '',
            note: '',
            shareLocation: true,
            shareContact: true,
        }
    }),
}))

// Example Usage:
// 
// // Pattern 1: Selector Hook Usage (Recommended for React components)
const StatusFormComponent = () => {
  // Get specific form data
  const firstName = useStatusFormStore((state) => state.formData.firstName);
  const statusType = useStatusFormStore((state) => state.formData.statusType);
//   
//   // Get actions
  const setFormData = useStatusFormStore((state) => state.setFormData);
  const resetFormData = useStatusFormStore((state) => state.resetFormData);
//   
//   // Update single field
  const handleFirstNameChange = (value: string) => {
    setFormData({ firstName: value });
  };
  
//   // Update multiple fields
  const handleLocationUpdate = (lat: number, lng: number, loc: string) => {
    setFormData({ lat, lng, loc });
  };
  
//   return (
//     <div>
//       <input 
//         value={firstName} 
//         onChange={(e) => handleFirstNameChange(e.target.value)} 
//       />
//       <button onClick={resetFormData}>Reset Form</button>
//     </div>
//   );
};
//
// // Pattern 2: Multiple selectors with shallow comparison
import { shallow } from 'zustand/shallow';

const OptimizedComponent = () => {
  const { firstName, lastName, statusType } = useStatusFormStore(
    (state) => ({
      firstName: state.formData.firstName,
      lastName: state.formData.lastName,
      statusType: state.formData.statusType,
    }),
    // shallow
  );
  
//   return <div>{firstName} {lastName} - {statusType}</div>;
};
//
// // Pattern 3: getState() Direct Access (For utilities/non-React contexts)
const submitForm = async () => {
  const { formData, resetFormData } = useStatusFormStore.getState();
  
  try {
    // await api.submitStatus(formData);
    resetFormData(); // Clear form after successful submission
  } catch (error) {
    console.error('Failed to submit form:', error);
  }
};
//
// // Pattern 4: Computed values
const FormSummary = () => {
  const isFormValid = useStatusFormStore((state) => {
    const { firstName, lastName, statusType } = state.formData;
    return firstName.trim() !== '' && lastName.trim() !== '' && statusType !== '';
  });
  
  const hasLocation = useStatusFormStore((state) => 
    state.formData.lat !== null && state.formData.lng !== null
  );
  
//   return (
//     <div>
//       <div>Form Valid: {isFormValid ? 'Yes' : 'No'}</div>
//       <div>Has Location: {hasLocation ? 'Yes' : 'No'}</div>
//     </div>
//   );
};