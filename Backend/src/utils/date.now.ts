export const getDateNow = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const year = now.getFullYear();
    const formattedDate = `${month}/${day}/${year}`;

    return formattedDate;
}

export default getDateNow;