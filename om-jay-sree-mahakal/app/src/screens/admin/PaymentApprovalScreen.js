import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Image, Alert } from 'react-native';
import { Card, Title, Paragraph, Text, Button, Chip, ActivityIndicator, Modal, Portal, TextInput, Dialog } from 'react-native-paper';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import moment from 'moment';

import { adminService } from '../../services/adminService';

const PaymentApprovalScreen = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [rejectDialogVisible, setRejectDialogVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [paymentToReject, setPaymentToReject] = useState(null);

  useEffect(() => {
    loadPendingPayments();
  }, []);

  const loadPendingPayments = async () => {
    try {
      const response = await adminService.getPendingPayments();
      setPayments(response.data);
    } catch (error) {
      console.error('Error loading pending payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (paymentId) => {
    setProcessing(true);
    try {
      await adminService.approvePayment(paymentId);
      Alert.alert('Success', 'Payment approved successfully');
      await loadPendingPayments(); // Reload the list
    } catch (error) {
      console.error('Error approving payment:', error);
      Alert.alert('Error', 'Failed to approve payment');
    } finally {
      setProcessing(false);
      setModalVisible(false);
    }
  };

  const handleReject = async (paymentId, rejectionReason) => {
    if (!rejectionReason) {
      Alert.alert('Error', 'Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    try {
      await adminService.rejectPayment(paymentId, rejectionReason);
      Alert.alert('Success', 'Payment rejected successfully');
      await loadPendingPayments(); // Reload the list
    } catch (error) {
      console.error('Error rejecting payment:', error);
      Alert.alert('Error', 'Failed to reject payment');
    } finally {
      setProcessing(false);
      setModalVisible(false);
    }
  };

  const showScreenshot = (payment) => {
    setSelectedPayment(payment);
    setModalVisible(true);
  };

  const showRejectDialog = (payment) => {
    setPaymentToReject(payment);
    setRejectDialogVisible(true);
  };

  const handleRejectConfirm = () => {
    if (paymentToReject && rejectionReason.trim()) {
      handleReject(paymentToReject._id, rejectionReason.trim());
      setRejectDialogVisible(false);
      setRejectionReason('');
      setPaymentToReject(null);
    }
  };

  const renderPaymentCard = ({ item }) => (
    <Card style={styles.paymentCard}>
      <Card.Content>
        <View style={styles.paymentHeader}>
          <View style={styles.paymentInfo}>
            <Title style={styles.amount}>₹{item.amount?.toLocaleString()}</Title>
            <Paragraph style={styles.details}>
              For {item.forDays} day{item.forDays > 1 ? 's' : ''} • {item.borrowerId?.name}
            </Paragraph>
          </View>
          <Chip 
            mode="outlined" 
            style={styles.pendingChip}
            textStyle={{ color: '#ff6f00' }}
          >
            PENDING
          </Chip>
        </View>

        <View style={styles.paymentDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Icon name="account-balance" size={14} color="#666" />
              <Text style={styles.detailText}>Loan: {item.loanId?.loanId}</Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="calendar-today" size={14} color="#666" />
              <Text style={styles.detailText}>
                {moment(item.paymentDate).format('DD MMM YYYY')}
              </Text>
            </View>
          </View>

          {item.utrNumber && (
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Icon name="receipt" size={14} color="#666" />
                <Text style={styles.detailText}>UTR: {item.utrNumber}</Text>
              </View>
            </View>
          )}

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Icon name="person" size={14} color="#666" />
              <Text style={styles.detailText}>Lender: {item.lenderId?.name}</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardActions}>
          <Button
            mode="outlined"
            icon="image"
            onPress={() => showScreenshot(item)}
            style={styles.screenshotButton}
          >
            View Screenshot
          </Button>
          
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={() => handleApprove(item._id)}
              loading={processing}
              disabled={processing}
              style={[styles.actionButton, styles.approveButton]}
              compact
            >
              Approve
            </Button>
            <Button
              mode="outlined"
              onPress={() => showRejectDialog(item)}
              loading={processing}
              disabled={processing}
              style={[styles.actionButton, styles.rejectButton]}
              textColor="#d32f2f"
              compact
            >
              Reject
            </Button>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>Loading pending payments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Payment Approval</Text>
        <Text style={styles.subtitle}>
          {payments.length} payment{payments.length !== 1 ? 's' : ''} pending approval
        </Text>
      </View>

      <FlatList
        data={payments}
        renderItem={renderPaymentCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="check-circle" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No pending payments</Text>
            <Text style={styles.emptySubtext}>
              All payments have been processed
            </Text>
          </View>
        }
      />

      {/* Screenshot Modal */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          {selectedPayment && (
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Title style={styles.modalTitle}>Payment Screenshot</Title>
                <Button 
                  icon="close" 
                  onPress={() => setModalVisible(false)}
                  compact
                />
              </View>
              
              <Image 
                source={{ uri: selectedPayment.screenshotUrl }} 
                style={styles.screenshotImage}
                resizeMode="contain"
              />
              
              <View style={styles.paymentInfoModal}>
                <Text style={styles.paymentInfoText}>
                  Amount: ₹{selectedPayment.amount?.toLocaleString()}
                </Text>
                <Text style={styles.paymentInfoText}>
                  Borrower: {selectedPayment.borrowerId?.name}
                </Text>
                <Text style={styles.paymentInfoText}>
                  Loan: {selectedPayment.loanId?.loanId}
                </Text>
                {selectedPayment.utrNumber && (
                  <Text style={styles.paymentInfoText}>
                    UTR: {selectedPayment.utrNumber}
                  </Text>
                )}
              </View>

              <View style={styles.modalActions}>
                <Button
                  mode="contained"
                  onPress={() => handleApprove(selectedPayment._id)}
                  loading={processing}
                  disabled={processing}
                  style={styles.modalApproveButton}
                >
                  Approve Payment
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setModalVisible(false);
                    showRejectDialog(selectedPayment);
                  }}
                  loading={processing}
                  disabled={processing}
                  style={styles.modalRejectButton}
                  textColor="#d32f2f"
                >
                  Reject Payment
                </Button>
              </View>
            </View>
          )}
        </Modal>
      </Portal>

      {/* Rejection Dialog */}
      <Portal>
        <Dialog
          visible={rejectDialogVisible}
          onDismiss={() => {
            setRejectDialogVisible(false);
            setRejectionReason('');
            setPaymentToReject(null);
          }}
        >
          <Dialog.Title>Reject Payment</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Rejection Reason"
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={3}
              style={styles.rejectionInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setRejectDialogVisible(false);
                setRejectionReason('');
                setPaymentToReject(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onPress={handleRejectConfirm}
              disabled={!rejectionReason.trim()}
            >
              Reject
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  listContent: {
    paddingBottom: 16,
  },
  paymentCard: {
    marginBottom: 12,
    elevation: 2,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 4,
  },
  details: {
    color: '#666',
    fontSize: 12,
  },
  pendingChip: {
    borderColor: '#ff6f00',
    height: 24,
  },
  paymentDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    marginLeft: 6,
    color: '#666',
    fontSize: 12,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  screenshotButton: {
    flex: 1,
    marginRight: 8,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 4,
  },
  approveButton: {
    backgroundColor: '#388e3c',
  },
  rejectButton: {
    borderColor: '#d32f2f',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalContent: {
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  screenshotImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 16,
  },
  paymentInfoModal: {
    marginBottom: 16,
  },
  paymentInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalApproveButton: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#388e3c',
  },
  modalRejectButton: {
    flex: 1,
    marginLeft: 8,
    borderColor: '#d32f2f',
  },
  rejectionInput: {
    marginTop: 8,
  },
});

export default PaymentApprovalScreen;