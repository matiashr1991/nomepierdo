import { QrCode } from "lucide-react";
import { Fredoka } from "next/font/google";
import Link from "next/link";

const fredoka = Fredoka({ subsets: ["latin"], weight: ["500", "600", "700"] });

interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showIcon?: boolean;
  href?: string | null;
}

export function Logo({ 
  className = "", 
  iconClassName = "h-8 w-8 text-green-600", 
  textClassName = "text-2xl bg-gradient-to-r from-green-700 to-green-500 bg-clip-text text-transparent",
  showIcon = true,
  href = "/"
}: LogoProps) {
  const content = (
    <>
      {showIcon && <QrCode className={iconClassName} />}
      <span className={`${fredoka.className} font-bold tracking-tight ${textClassName}`}>
        No Me Pierdo
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`flex items-center space-x-2 ${className}`}>
        {content}
      </Link>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {content}
    </div>
  );
}
