import re
from typing import List, Dict, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from lunar_python import EightChar, Lunar, Solar
from src.engine.models import ZiShiMode, MonthMode, BaziRequest
from src.engine.preprocessor import BaziContext

# --- 核心命盘 ---
class Column(BaseModel):
    gan: str
    zhi: str
    shi_shen_gan: str
    shi_shen_zhi: List[str]
    hide_gan: List[str]
    na_yin: str
    xun_kong: List[str]

class JieQiContext(BaseModel):
    prev_name: str # 上一个节气名称
    prev_jie: str  # 上一个节气时刻
    next_name: str # 下一个节气名称
    next_jie: str  # 下一个节气时刻

class CoreChart(BaseModel):
    year: Column
    month: Column
    day: Column
    time: Column
    jie_qi: JieQiContext

# --- 动态运程 ---
class LiuRi(BaseModel):
    day: int
    gan_zhi: str

class LiuYue(BaseModel):
    month: int
    gan_zhi: str
    liu_ri: List[LiuRi] = []

class LiuNian(BaseModel):
    year: int
    gan_zhi: str
    xun: str
    liu_yue: List[LiuYue] = []

class XiaoYun(BaseModel):
    index: int
    gan_zhi: str

class DaYun(BaseModel):
    index: int
    start_year: int
    start_age: int
    gan_zhi: str
    xun: str
    liu_nian: List[LiuNian] = []
    xiao_yun: List[XiaoYun] = []

class FortuneData(BaseModel):
    start_solar: str
    start_age: int
    da_yun: List[DaYun]
    before_start_xiao_yun: List[XiaoYun] = [] # 起运前的小运

# --- 辅助命盘 ---
class AuxiliaryChart(BaseModel):
    year_di_shi: str
    month_di_shi: str
    day_di_shi: str
    time_di_shi: str
    tai_yuan: str
    tai_yuan_na_yin: str
    ming_gong: str
    ming_gong_na_yin: str
    shen_gong: str
    shen_gong_na_yin: str

# --- 提取逻辑 ---
class CoreExtractor:
    @staticmethod
    def extract(ctx: BaziContext) -> CoreChart:
        lunar = ctx.solar.getLunar()
        eight_char = lunar.getEightChar()
        
        if ctx.request.zi_shi_mode == ZiShiMode.NEXT_DAY:
            eight_char.setSect(1)
        else:
            eight_char.setSect(2)
            
        def get_col(gan_func, zhi_func, shi_gan_func, shi_zhi_func, hide_gan_func, na_yin_func, xun_kong_func) -> Column:
            return Column(
                gan=gan_func(),
                zhi=zhi_func(),
                shi_shen_gan=shi_gan_func(),
                shi_shen_zhi=shi_zhi_func(),
                hide_gan=hide_gan_func(),
                na_yin=na_yin_func(),
                xun_kong=list(xun_kong_func())
            )

        # 补救 2.1.3: 处理月柱分支模式
        month_gan = eight_char.getMonthGan()
        month_zhi = eight_char.getMonthZhi()
        if ctx.request.month_mode == MonthMode.LUNAR_MONTH:
            from lunar_python import LunarYear
            ly = LunarYear.fromYear(lunar.getYear())
            # 找到对应的农历月对象，需匹配月份数字且匹配闰月属性
            lm = None
            for m in ly.getMonths():
                if abs(m.getMonth()) == abs(lunar.getMonth()):
                    # 如果当前月是闰月，则必须匹配闰月属性；否则匹配非闰月
                    if (lunar.getMonth() < 0 and m.getMonth() < 0) or (lunar.getMonth() > 0 and m.getMonth() > 0):
                        lm = m
                        break
            if lm:
                month_gan = lm.getGanZhi()[:1]
                month_zhi = lm.getGanZhi()[1:]

        return CoreChart(
            year=get_col(
                eight_char.getYearGan, eight_char.getYearZhi,
                eight_char.getYearShiShenGan, eight_char.getYearShiShenZhi,
                eight_char.getYearHideGan, eight_char.getYearNaYin,
                eight_char.getYearXunKong
            ),
            month=Column(
                gan=month_gan,
                zhi=month_zhi,
                shi_shen_gan=eight_char.getMonthShiShenGan(),
                shi_shen_zhi=eight_char.getMonthShiShenZhi(),
                hide_gan=eight_char.getMonthHideGan(),
                na_yin=eight_char.getMonthNaYin(),
                xun_kong=list(eight_char.getMonthXunKong())
            ),
            day=get_col(
                eight_char.getDayGan, eight_char.getDayZhi,
                eight_char.getDayShiShenGan, eight_char.getDayShiShenZhi,
                eight_char.getDayHideGan, eight_char.getDayNaYin,
                eight_char.getDayXunKong
            ),
            time=get_col(
                eight_char.getTimeGan, eight_char.getTimeZhi,
                eight_char.getTimeShiShenGan, eight_char.getTimeShiShenZhi,
                eight_char.getTimeHideGan, eight_char.getTimeNaYin,
                eight_char.getTimeXunKong
            ),
            # 补救 2.1.2: 节气上下文
            jie_qi=JieQiContext(
                prev_name=lunar.getPrevJie().getName(),
                prev_jie=re.sub(r"\s(白羊|金牛|双子|巨蟹|狮子|处女|天秤|天蝎|射手|摩羯|水瓶|双鱼)座", "", lunar.getPrevJie().getSolar().toFullString()),
                next_name=lunar.getNextJie().getName(),
                next_jie=re.sub(r"\s(白羊|金牛|双子|巨蟹|狮子|处女|天秤|天蝎|射手|摩羯|水瓶|双鱼)座", "", lunar.getNextJie().getSolar().toFullString())
            )
        )

class FortuneExtractor:
    @staticmethod
    def extract(ctx: BaziContext) -> FortuneData:
        lunar = ctx.solar.getLunar()
        eight_char = lunar.getEightChar()
        yun = eight_char.getYun(ctx.request.gender)
        
        da_yun_list = []
        before_start_xiao_yun = []
        
        for i, dy in enumerate(yun.getDaYun()):
            # 补救 2.2.2: 提取小运
            xiao_yun_objs = []
            for xy in dy.getXiaoYun():
                xiao_yun_objs.append(XiaoYun(index=xy.getIndex(), gan_zhi=xy.getGanZhi()))
            
            if i == 0:
                before_start_xiao_yun = xiao_yun_objs
                continue
            
            ln_list = []
            for ln in dy.getLiuNian():
                # 补救 2.2.1: 预留级联结构
                ln_list.append(LiuNian(
                    year=ln.getYear(),
                    gan_zhi=ln.getGanZhi(),
                    xun=ln.getXun(),
                    liu_yue=[] # 暂不深度递归，防止输出过大
                ))
                
            da_yun_list.append(DaYun(
                index=i,
                start_year=dy.getStartYear(),
                start_age=dy.getStartAge(),
                gan_zhi=dy.getGanZhi(),
                xun=dy.getXun(),
                liu_nian=ln_list,
                xiao_yun=xiao_yun_objs
            ))
            
        return FortuneData(
            start_solar=re.sub(r"\s(白羊|金牛|双子|巨蟹|狮子|处女|天秤|天蝎|射手|摩羯|水瓶|双鱼)座", "", yun.getStartSolar().toFullString()),
            # 补救 2.2.3: 修正起运年龄获取
            start_age=yun.getStartYear() - ctx.solar.getYear() if yun.getStartYear() > 0 else 0,
            da_yun=da_yun_list,
            before_start_xiao_yun=before_start_xiao_yun
        )

class AuxiliaryExtractor:
    @staticmethod
    def extract(ctx: BaziContext) -> AuxiliaryChart:
        eight_char = ctx.solar.getLunar().getEightChar()
        return AuxiliaryChart(
            year_di_shi=eight_char.getYearDiShi(),
            month_di_shi=eight_char.getMonthDiShi(),
            day_di_shi=eight_char.getDayDiShi(),
            time_di_shi=eight_char.getTimeDiShi(),
            tai_yuan=eight_char.getTaiYuan(),
            tai_yuan_na_yin=eight_char.getTaiYuanNaYin(),
            ming_gong=eight_char.getMingGong(),
            ming_gong_na_yin=eight_char.getMingGongNaYin(),
            shen_gong=eight_char.getShenGong(),
            shen_gong_na_yin=eight_char.getShenGongNaYin()
        )
