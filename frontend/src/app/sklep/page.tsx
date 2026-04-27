'use client';

import { SklepPageContent } from '@/app/(dashboard)/panel/sklep/page';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/cart.store';

export default function PublicSklepPage() {
  const itemsInCart = useCartStore((state) => state.items.length);

  return (
    <div className="min-h-screen">
      <header className="text-white sticky top-4 z-40 px-4">
        <div className="container mx-auto bg-[#466ec6] flex h-16 lg:h-20 items-center justify-between px-4 rounded-[20px]">
          <Link href="/sklep">
            <Image src="/logo.png" alt="ZozoApp Logo" width={150} height={52} priority className="hidden md:block" />
            <Image src="/logo.png" alt="ZozoApp Logo" width={100} height={35} priority className="block md:hidden" />
          </Link>
          <Link href="/koszyk">
            <Button variant="ghost" size="icon" className="relative rounded-full text-white hover:bg-white/20 hover:text-white">
              <ShoppingCart className="h-5 w-5" />
              {itemsInCart > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {itemsInCart}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </header>
      <main className="container mx-auto p-4 lg:p-8">
        <SklepPageContent />
      </main>
    </div>
  );
}
