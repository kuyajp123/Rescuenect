// Convert contact number to E.164 format (+63xxxxxxxxxx)
export const convertToE164Format = (contactNumber: string): string => {
    // Remove all non-numeric characters
    const numericOnly = contactNumber.replace(/\D/g, '');
    
    // Convert to E.164 format
    if (numericOnly.length === 11 && numericOnly.startsWith('09')) {
        // Replace leading 09 with +639
        return `+63${numericOnly.slice(1)}`;
    } else if (numericOnly.length === 10 && numericOnly.startsWith('9')) {
        // Add +639 prefix
        return `+639${numericOnly}`;
    } else if (numericOnly.length === 11 && numericOnly.startsWith('63')) {
        // Add + prefix
        return `+${numericOnly}`;
    }
    
    // Default: assume it's a 10-digit number and add +639
    return `+639${numericOnly}`;
};


// Format contact number with dashes and limit to 11 digits
export const formatContactNumber = (text: string): string => {
    // Remove all non-numeric characters
    const numericOnly = text.replace(/\D/g, '');
    
    // Limit to 11 digits
    const limitedNumbers = numericOnly.slice(0, 11);
    
    // Format with dashes: XXXX-XXX-XXXX
    if (limitedNumbers.length <= 4) {
        return limitedNumbers;
    } else if (limitedNumbers.length <= 7) {
        return `${limitedNumbers.slice(0, 4)}-${limitedNumbers.slice(4)}`;
    } else {
        return `${limitedNumbers.slice(0, 4)}-${limitedNumbers.slice(4, 7)}-${limitedNumbers.slice(7)}`;
    }
};