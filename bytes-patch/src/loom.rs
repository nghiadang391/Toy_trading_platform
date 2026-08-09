#[cfg(not(all(test, loom)))]
pub(crate) mod sync {
    pub(crate) mod atomic {
        pub(crate) use core::sync::atomic::Ordering;
        use core::cell::UnsafeCell;

        pub(crate) struct AtomicUsize {
            val: UnsafeCell<usize>,
        }

        impl AtomicUsize {
            pub(crate) const fn new(val: usize) -> Self {
                Self { val: UnsafeCell::new(val) }
            }
            pub(crate) fn load(&self, _order: Ordering) -> usize {
                unsafe { *self.val.get() }
            }
            pub(crate) fn store(&self, val: usize, _order: Ordering) {
                unsafe { *self.val.get() = val; }
            }
            pub(crate) fn fetch_add(&self, val: usize, _order: Ordering) -> usize {
                unsafe {
                    let old = *self.val.get();
                    *self.val.get() = old + val;
                    old
                }
            }
            pub(crate) fn fetch_sub(&self, val: usize, _order: Ordering) -> usize {
                unsafe {
                    let old = *self.val.get();
                    *self.val.get() = old - val;
                    old
                }
            }
            pub(crate) fn compare_exchange(&self, current: usize, new: usize, _success: Ordering, _failure: Ordering) -> Result<usize, usize> {
                unsafe {
                    let old = *self.val.get();
                    if old == current {
                        *self.val.get() = new;
                        Ok(old)
                    } else {
                        Err(old)
                    }
                }
            }
            pub(crate) fn compare_exchange_weak(&self, current: usize, new: usize, success: Ordering, failure: Ordering) -> Result<usize, usize> {
                self.compare_exchange(current, new, success, failure)
            }
            pub(crate) fn swap(&self, val: usize, _order: Ordering) -> usize {
                unsafe {
                    let old = *self.val.get();
                    *self.val.get() = val;
                    old
                }
            }
        }

        unsafe impl Send for AtomicUsize {}
        unsafe impl Sync for AtomicUsize {}

        pub(crate) struct AtomicPtr<T> {
            val: UnsafeCell<*mut T>,
        }

        impl<T> AtomicPtr<T> {
            pub(crate) const fn new(val: *mut T) -> Self {
                Self { val: UnsafeCell::new(val) }
            }
            pub(crate) fn load(&self, _order: Ordering) -> *mut T {
                unsafe { *self.val.get() }
            }
            pub(crate) fn store(&self, val: *mut T, _order: Ordering) {
                unsafe { *self.val.get() = val; }
            }
            pub(crate) fn swap(&self, val: *mut T, _order: Ordering) -> *mut T {
                unsafe {
                    let old = *self.val.get();
                    *self.val.get() = val;
                    old
                }
            }
            pub(crate) fn compare_exchange(&self, current: *mut T, new: *mut T, _success: Ordering, _failure: Ordering) -> Result<*mut T, *mut T> {
                unsafe {
                    let old = *self.val.get();
                    if old == current {
                        *self.val.get() = new;
                        Ok(old)
                    } else {
                        Err(old)
                    }
                }
            }
            pub(crate) fn get_mut(&mut self) -> &mut *mut T {
                unsafe { &mut *self.val.get() }
            }
        }

        unsafe impl<T> Send for AtomicPtr<T> {}
        unsafe impl<T> Sync for AtomicPtr<T> {}

        pub(crate) trait AtomicMut<T> {
            fn with_mut<F, R>(&mut self, f: F) -> R
            where
                F: FnOnce(&mut *mut T) -> R;
        }

        impl<T> AtomicMut<T> for AtomicPtr<T> {
            fn with_mut<F, R>(&mut self, f: F) -> R
            where
                F: FnOnce(&mut *mut T) -> R,
            {
                f(self.get_mut())
            }
        }
    }
}

#[cfg(all(test, loom))]
pub(crate) mod sync {
    pub(crate) mod atomic {
        pub(crate) use loom::sync::atomic::{AtomicPtr, AtomicUsize, Ordering};

        pub(crate) trait AtomicMut<T> {}
    }
}
