import toast from 'react-hot-toast';

export const showSuccessToast = (message: string) => {
  toast.success(message, {
    duration: 3000,
    position: 'top-center',
    style: {
      border: '1px solid #61bd4f',
      padding: '16px',
      color: '#000',
      backgroundColor: '#eef6ec',
    },
    iconTheme: {
      primary: '#61bd4f',
      secondary: '#FFFAEE',
    },
  });
};

export const showErrorToast = (message: string) => {
  toast.error(message, {
    duration: 6000,
    position: 'top-center',
    style: {
      border: '1px solid #d3494e',
      padding: '16px',
      color: '#000',
      backgroundColor: '#fbeded',
    },
    iconTheme: {
      primary: '#d3494e',
      secondary: '#FFFAEE',
    },
  });
};
