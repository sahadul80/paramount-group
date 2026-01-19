import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TabLoadingIndicatorProps {
  isLoading: boolean;
  progress?: number;
  showProgress?: boolean;
}

const TabLoadingIndicator: React.FC<TabLoadingIndicatorProps> = ({
  isLoading,
  progress = 0,
  showProgress = false
}) => {
  return (
    <AnimatePresence>
      {isLoading && (
        <>
          {/* Top progress bar */}
          {showProgress && (
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              exit={{ opacity: 0 }}
              className="fixed top-0 left-0 w-full h-1 bg-secondary/30 z-50 origin-left backdrop-blur-sm"
            >
              <motion.div
                className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.2, ease: "linear" }}
              />
            </motion.div>
          )}
          
          {/* Loading overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40 flex items-center justify-center"
          >
            <div className="bg-card border border-border rounded-xl shadow-2xl p-8 max-w-md mx-4">
              <div className="flex flex-col items-center space-y-6">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 bg-primary rounded-full animate-ping"></div>
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">Loading Tab Content</h3>
                  <p className="text-sm text-muted-foreground">
                    Please wait while we fetch the latest data...
                  </p>
                </div>
                {showProgress && (
                  <div className="w-full space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Loading</span>
                      <span className="font-medium text-foreground">{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary to-primary/70"
                        initial={{ width: "0%" }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.2, ease: "linear" }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TabLoadingIndicator;