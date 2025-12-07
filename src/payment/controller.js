const { PortOneClient } = require('@portone/server-sdk');

const portone = PortOneClient({
  secret: process.env.PORTONE_API_SECRET,
});

const completePayment = async (req, res, next) => {
  try {
    // 프론트에서 넘어온 결제 ID (paymentId)
    const { paymentId, orderId } = req.body; 

    // 1. 포트원에 결제 정보 조회 요청
    const payment = await portone.payment.getPayment({ paymentId });

    // 2. (중요) 여기서 나중에 DB의 주문 금액과 payment.amount.total이 같은지 비교해야 합니다.
    // 지금은 일단 조회된 정보를 그대로 리턴합니다.
    
    console.log('포트원 검증 결과:', payment);

    res.status(200).json({ 
      success: true, 
      message: '결제 검증 성공',
      data: payment 
    });

  } catch (err) {
    // 에러 발생 시 index.js의 에러 핸들러로 넘김
    console.error(err);
    next(err);
  }
};

module.exports = {
  completePayment,
};