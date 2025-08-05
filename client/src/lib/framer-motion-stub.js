// Stub pour framer-motion pour éviter les erreurs de déploiement
export const motion = {};
export const AnimatePresence = ({ children }) => children;
export const animate = () => {};
export const useAnimation = () => ({});
export const useInView = () => false;
export const useMotionValue = () => ({});
export const useScroll = () => ({});
export const useSpring = () => ({});
export const useTransform = () => ({});
export const useVelocity = () => ({});

// Export par défaut
export default {
  motion,
  AnimatePresence,
  animate,
  useAnimation,
  useInView,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
};