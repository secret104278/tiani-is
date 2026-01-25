import { stdin as input, stdout as output } from "node:process";
import * as readline from "node:readline/promises";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const targetList = [
  "高雄天惠堂-陳徳觀",
  "天一聖道院-蔡清東",
  "張氏佛堂-張清涼/陳麗蓉",
  "陳氏佛堂-陳貞一/李美金",
  "陳氏佛堂-陳榮駿/吳玉美",
  "許氏佛堂-許澤鴻/陳秀倓",
  "莊氏佛堂-莊文滄/吳靚琳",
  "張氏佛堂-張天民/陳玉珍",
  "陳氏佛堂-陳素柑",
  "江氏佛堂-江建廷/徐儀真",
  "葉氏佛堂-葉柿",
  "天智佛堂-藍清興/張如蘭",
  "黃氏佛堂-黃榮惠/陳春花",
  "吳氏佛堂-吳趁",
  "李氏佛堂-李三奇/郭敏",
  "李氏佛堂-李蒼榮",
  "王氏佛堂-王誠恭/陳貴珠",
  "天誠佛堂-林國洲/蔣秋珠",
  "林氏佛堂-林清標/蔡美華",
  "買氏佛堂-買藝臻",
  "林氏佛堂-林國長/賴瑾垵",
  "李氏佛堂-李忠憬/陳昭桂",
  "蘇氏佛堂-蘇進添/沈淑嬿",
  "陳氏佛堂-陳德觀/林滿娖",
  "吳氏佛堂-吳朝明/賴甘",
  "黄氏佛堂-黃冠賓/李虹瑩",
  "吳氏佛堂-吳昭慶/王美鶯",
  "蔣氏佛堂-蔣素霞/呂理事",
  "徐氏佛堂-林美麗",
  "天宏佛堂-謝閎仕/詹秀華",
  "洪氏佛堂-洪祈財/陳秀慧",
  "郭氏佛堂-郭貴香/洪四福",
  "劉氏佛堂-劉信賢/林鳳錦",
  "林氏佛堂-林阿陸",
  "林氏佛堂-蔡碧華/林書丞",
  "蔡氏佛堂-蔡朝全/吳紋蜞",
  "何氏佛堂-何景明/林翠華",
  "蔡氏佛堂-蔡順語",
  "李氏佛堂-李春美",
  "許氏佛堂-許良滿/蔡蓮香",
  "林氏佛堂-林玉娥",
  "林氏佛堂-林淑惠",
  "天元佛堂-王元良/楊守芝",
  "陸氏佛堂-陸金益/黃素勤",
  "洪氏佛堂-洪景順/王淑津",
  "黃氏佛堂-黃崇錡/周彩雲",
  "魏氏佛堂-魏志眾/江秋云",
  "黃氏佛堂-黃守涵",
  "張氏佛堂-張倉銘/張瑞月",
  "張氏佛堂-張酪詩/胡秀宜",
  "徐氏佛堂-徐經邦/馮秀蘭",
];

async function main() {
  const rl = readline.createInterface({ input, output });

  try {
    console.log("\n🔍 正在讀取資料庫現狀...");
    const dbLocations = await prisma.yideWorkLocation.findMany();
    const nameToDbMap = new Map(dbLocations.map((loc) => [loc.name, loc]));

    const toUpdate: { id: number; name: string; sortOrder: number }[] = [];
    const toCreate: { name: string; sortOrder: number }[] = [];

    // 1. 分析清單
    targetList.forEach((name, index) => {
      const sortOrder = index + 1;
      const existing = nameToDbMap.get(name);
      if (existing) {
        toUpdate.push({ id: existing.id, name, sortOrder });
      } else {
        toCreate.push({ name, sortOrder });
      }
    });

    // 2. 找出清單外但存在於 DB 的地點
    const orphans = dbLocations.filter((db) => !targetList.includes(db.name));

    // --- 顯示對比報告 ---
    console.log("\n========= 📋 佛堂地點同步分析報告 =========");

    if (toUpdate.length > 0) {
      console.log(`✅ 將更新順序的地點 (${toUpdate.length} 筆):`);
      // console.log(toUpdate.map(i => `   ${i.sortOrder}. ${i.name}`).join("\n"));
    }

    if (toCreate.length > 0) {
      console.log(`\n✨ 將新增的地點 (${toCreate.length} 筆):`);
      console.log(
        toCreate
          .map((i) => `   [ADD] ${i.name} (位置: ${i.sortOrder})`)
          .join("\n"),
      );
    }

    if (orphans.length > 0) {
      console.log(`\n⚠️ 存在於資料庫但不在清單中的地點 (${orphans.length} 筆):`);
      console.log(orphans.map((i) => `   [ORPHAN] ${i.name}`).join("\n"));
      console.log("   (註: 這些地點將會被排到最後面 sortOrder = 999)");
    }

    console.log("\n===========================================");

    // --- 互動確認 ---
    const totalChanges =
      toUpdate.length + toCreate.length + (orphans.length > 0 ? 1 : 0);

    if (totalChanges === 0) {
      console.log("👍 資料庫已是最新狀態，無需更新。");
      return;
    }

    const answer = await rl.question(
      "\n❓ 發現以上差異。是否執行資料庫寫入？ (y/N): ",
    );

    if (answer.toLowerCase() === "y") {
      console.log("\n💾 正在執行寫入...");

      await prisma.$transaction([
        // 重置所有清單外地點
        prisma.yideWorkLocation.updateMany({
          where: { id: { in: orphans.map((o) => o.id) } },
          data: { sortOrder: 999 },
        }),
        // 更新現有地點排序
        ...toUpdate.map((item) =>
          prisma.yideWorkLocation.update({
            where: { id: item.id },
            data: { sortOrder: item.sortOrder },
          }),
        ),
        // 建立新地點
        ...toCreate.map((item) =>
          prisma.yideWorkLocation.create({
            data: { name: item.name, sortOrder: item.sortOrder },
          }),
        ),
      ]);

      console.log("🎉 同步成功！請刷新網頁查看結果。");
    } else {
      console.log("🚫 已取消操作。資料庫未做任何變動。");
    }
  } catch (error) {
    console.error("❌ 執行失敗:", error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main();
