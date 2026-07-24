import Transaction from '@/models/Transaction';

export const SOCIAL_MILESTONES = [
  { level: 5, targetUSD: 50, cumulativeUSD: 50 },
  { level: 10, targetUSD: 100, cumulativeUSD: 150 },
  { level: 20, targetUSD: 200, cumulativeUSD: 350 },
  { level: 30, targetUSD: 300, cumulativeUSD: 650 },
  { level: 40, targetUSD: 400, cumulativeUSD: 1050 },
  { level: 50, targetUSD: 500, cumulativeUSD: 1550 },
];

export async function processSocialTaskMilestones(user) {
  let payoutUSD = 0;
  const PKR_RATE = 300;

  // Initialize if undefined
  if (!user.paidSocialTaskMilestones) {
    user.paidSocialTaskMilestones = [];
  }
  
  if (user.lifetimeSocialTaskUSD === undefined || user.lifetimeSocialTaskUSD === null) {
    // Dynamically calculate if it's missing (backwards compatibility for existing users)
    const pastSocialTasks = await Transaction.find({
      userPhone: user.phone,
      type: 'social_task_reward',
      status: 'completed'
    }).lean();
    
    let lifetimeUSD = 0;
    pastSocialTasks.forEach(txn => {
      lifetimeUSD += (txn.amount || 0) / PKR_RATE;
    });
    user.lifetimeSocialTaskUSD = lifetimeUSD;
  }

  const userLevel = (user.claimedLevels && user.claimedLevels.length > 0) ? Math.max(...user.claimedLevels) : 0;

  for (const milestone of SOCIAL_MILESTONES) {
    const hasReachedLevel = userLevel >= milestone.level;
    const hasEnoughEarnings = user.lifetimeSocialTaskUSD >= milestone.cumulativeUSD;
    const isNotPaidYet = !user.paidSocialTaskMilestones.includes(milestone.level);

    if (hasReachedLevel && hasEnoughEarnings && isNotPaidYet) {
      const payoutPKR = milestone.targetUSD * PKR_RATE;
      
      user.balance = (user.balance || 0) + payoutPKR;
      user.paidSocialTaskMilestones.push(milestone.level);
      payoutUSD += milestone.targetUSD;
      
      await Transaction.create({
        transactionId: `TXN-SOCIAL-MILESTONE-${milestone.level}-${Date.now()}`,
        userId: user.phone,
        userName: user.name,
        userPhone: user.phone,
        amount: payoutPKR,
        type: 'social_task_retroactive',
        status: 'completed',
        description: `Social Task Reward Unlocked at Level ${milestone.level} ($${milestone.targetUSD})`,
        createdAt: new Date()
      });
    }
  }

  return payoutUSD; // Returns the total USD paid out during this check, if any
}
