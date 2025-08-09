import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';


const BulkActionDialog = ({ 
  isOpen, 
  onClose, 
  action, 
  selectedPairs, 
  onConfirm 
}) => {
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm(action, selectedPairs, reason);
      setReason('');
      onClose();
    } catch (error) {
      console.error('Bulk action failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getActionDetails = () => {
    switch (action) {
      case 'approve':
        return {
          title: 'Approve Market Pairs',
          description: 'This will approve the selected market pairs and make them active for arbitrage detection.',
          icon: 'Check',
          iconColor: 'var(--color-success)',
          confirmText: 'Approve Pairs',
          variant: 'default'
        };
      case 'reject':
        return {
          title: 'Reject Market Pairs',
          description: 'This will reject the selected market pairs and exclude them from future matching.',
          icon: 'X',
          iconColor: 'var(--color-error)',
          confirmText: 'Reject Pairs',
          variant: 'destructive'
        };
      case 'link':
        return {
          title: 'Link Market Pairs',
          description: 'This will manually link the selected market pairs for arbitrage monitoring.',
          icon: 'Link',
          iconColor: 'var(--color-accent)',
          confirmText: 'Link Pairs',
          variant: 'default'
        };
      case 'unlink':
        return {
          title: 'Unlink Market Pairs',
          description: 'This will unlink the selected market pairs and stop arbitrage monitoring.',
          icon: 'Unlink',
          iconColor: 'var(--color-warning)',
          confirmText: 'Unlink Pairs',
          variant: 'outline'
        };
      default:
        return {
          title: 'Bulk Action',
          description: 'Perform bulk action on selected market pairs.',
          icon: 'Settings',
          iconColor: 'var(--color-text-primary)',
          confirmText: 'Confirm',
          variant: 'default'
        };
    }
  };

  const actionDetails = getActionDetails();

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Dialog */}
      <div className="relative bg-card border border-border rounded-lg shadow-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Icon 
                name={actionDetails?.icon} 
                size={20} 
                color={actionDetails?.iconColor} 
              />
            </div>
            <h2 className="text-lg font-semibold text-text-primary">
              {actionDetails?.title}
            </h2>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            iconName="X"
          />
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-text-secondary">
            {actionDetails?.description}
          </p>

          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Selected pairs:</span>
              <span className="font-medium text-text-primary">
                {selectedPairs?.length} pair{selectedPairs?.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {(action === 'reject' || action === 'unlink') && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Reason (Optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e?.target?.value)}
                placeholder={`Explain why you're ${action}ing these pairs...`}
                className="w-full h-20 px-3 py-2 border border-border rounded-md bg-input text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
          )}

          <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <Icon name="AlertTriangle" size={16} color="var(--color-warning)" className="mt-0.5" />
              <div className="text-sm text-warning">
                <strong>Warning:</strong> This action cannot be undone. Make sure you want to proceed.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            variant={actionDetails?.variant}
            onClick={handleConfirm}
            loading={isProcessing}
            iconName={actionDetails?.icon}
            iconPosition="left"
          >
            {actionDetails?.confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkActionDialog;