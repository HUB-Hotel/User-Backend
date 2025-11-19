const express = require('express');
const router = express.Router();
const Lodging = require('../models/Lodging');
const Room = require('../models/Room');

// [날짜 변환 함수]
function getDatesInRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const date = new Date(start.getTime());
    const dates = [];
    while (date < end) {
        dates.push(new Date(date));
        date.setDate(date.getDate() + 1);
    }
    return dates;
}

// 1. 숙소 등록
router.post('/', async (req, res) => {
    try {
        const newLodging = await Lodging.create(req.body);
        // [통일된 응답]
        res.status(201).json({
            success: true,
            message: "숙소가 성공적으로 등록되었습니다.",
            data: newLodging
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 2. 숙소 목록 검색 (+날짜 필터)
router.get('/', async (req, res) => {
    try {
        const { loc, category, star, hashtag, checkIn, checkOut } = req.query;
        let query = {};

        // (1) 날짜 필터
        if (checkIn && checkOut) {
            const searchDates = getDatesInRange(checkIn, checkOut);
            const availableRooms = await Room.find({
                "roomNumbers": {
                    $elemMatch: { unavailableDates: { $nin: searchDates } }
                }
            }).select("lodgingId");
            const availableLodgingIds = availableRooms.map(room => room.lodgingId);
            query._id = { $in: availableLodgingIds };
        }

        // (2) 기타 필터
        if (loc) {
            query.$or = [
                { address: { $regex: loc, $options: 'i' } },
                { country: { $regex: loc, $options: 'i' } }
            ];
        }
        if (category) query.category = category;
        if (star) query.starRating = { $gte: Number(star) };
        if (hashtag) query.hashtags = { $in: [hashtag] };

        // 조회
        const lodgings = await Lodging.find(query);

        // [통일된 응답] - 결과가 0개여도 구조는 똑같음
        res.status(200).json({
            success: true,
            message: lodgings.length === 0 ? "검색 조건에 맞는 숙소가 없습니다." : `${lodgings.length}개의 숙소를 찾았습니다.`,
            data: lodgings
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 3. 숙소 상세 조회
router.get('/:id', async (req, res) => {
    try {
        const lodging = await Lodging.findById(req.params.id);
        if (!lodging) {
            return res.status(404).json({ success: false, message: "해당 숙소를 찾을 수 없습니다." });
        }
        // [통일된 응답]
        res.status(200).json({
            success: true,
            message: "숙소 정보를 가져왔습니다.",
            data: lodging
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;