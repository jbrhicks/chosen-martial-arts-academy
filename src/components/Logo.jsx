export default function Logo({ size = 40, className = "" }) {
  return (
    <img
      src="https://media.base44.com/images/public/6a395a5a04e2d6cac8d5ae37/aed888868_CMAALogoNobackground.png"
      alt="Chosen Martial Arts Academy"
      style={{ width: size, height: size }}
      className={`object-contain shrink-0 ${className}`}
    />
  );
}