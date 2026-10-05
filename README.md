# Long-form Video Skill สำหรับ Claude Code

Skill ตัดต่อวิดีโอ Talking-head แนวนอนสำหรับ YouTube ด้วย Claude Code ทำงานครบตั้งแต่ถอดเสียง ตัดช่วงเงียบ ตัดพูดผิด ใส่กราฟิก จนถึง render เป็นไฟล์ MP4

**ทำโดย ต้น · Lazy Productive** · ต่อยอดจาก [HyperFrames Student Kit](https://github.com/nateherkai/hyperframes-student-kit) ของ Nate Herk (MIT)

## มีอะไรเพิ่มจากของเดิม
- **B-roll จากเว็บจริง:** ระบบจะอัดคลิปหน้าเว็บจริงที่เราพูดถึง เช่น หน้าประกาศ, GitHub หรือเอกสาร ด้วย `scripts/record-broll.mjs` แล้วใส่ลงในวิดีโอแบบเต็มจอและแบบในกรอบข้างตัวเรา
  - ก่อนใช้จะเช็กว่าหน้าเว็บตรงกับที่เราพูดจริง
  - ข้ามแบนเนอร์คุกกี้ให้อัตโนมัติ
  - ไม่ล็อกอินหรือกรอกอะไรบนเว็บ
  - เก็บแหล่งที่มาของทุกคลิปไว้ใน `footage-ledger.json`
- **ไม่ใส่เพลงพื้นหลัง:** เสียงมีแค่เสียงพูดกับ sound effect ปรับความดังไว้ที่ −16 LUFS พร้อมอัป YouTube
- **ส่งงานเข้าโฟลเดอร์:** ไฟล์วิดีโอที่เสร็จแล้วจะถูก copy ไปไว้ในโฟลเดอร์ Long content ให้

## ติดตั้ง
ต้องมีก่อน:
- [Claude Code](https://claude.com/claude-code)
- Node.js 22 ขึ้นไป
- Git
- FFmpeg
- Google Chrome

```bash
git clone https://github.com/nateherkai/hyperframes-student-kit.git
cd hyperframes-student-kit && npm ci && npm run setup && cd ..
git clone https://github.com/tonsasawat-bit/longform-video-skill.git
./longform-video-skill/install.sh ./hyperframes-student-kit
```

## วิธีใช้
```bash
cd hyperframes-student-kit
claude
```
จากนั้นพิมพ์ใน Claude Code:
```
/edit-video ตัดต่อคลิปนี้ /path/to/my-video.mov
```

📖 **คู่มือภาษาไทยแบบละเอียด:** [Google Doc](https://docs.google.com/document/d/1GpJ2mJDrOIXAjw_2VFztfj8HVDfNjtHzDvUQmG2CMm8/edit)

## English (short)
This repo is a drop-in replacement for the `edit-video` skill in Nate Herk's HyperFrames Student Kit. It adds two long-form defaults:
- real web-page B-roll, recorded headless with Playwright (`scripts/record-broll.mjs`), with page verification and a footage ledger
- a voice + SFX mix with no background music

Install it with `./install.sh /path/to/hyperframes-student-kit`.
