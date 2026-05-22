export const getUserId = () => {
  let uid = localStorage.getItem('patungan_user_id');
  if (!uid) {
    uid = 'UID-' + Math.random().toString(36).substring(2, 12).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
    localStorage.setItem('patungan_user_id', uid);
  }
  return uid;
};
