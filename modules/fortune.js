/* ============================================================
   模块四：每日运势
   生辰八字排盘算法（节气月柱 + 60甲子日柱表 + 五鼠遁时柱）
   准确率验证：1989-04-01 03-05 时 → 己巳年 丁卯月 辛卯日 庚寅时
   ============================================================ */

const Fortune = {
  state: {
    tab: 'zodiac',
    selectedSign: null,
    bazi: null,
  },

  zodiacs: [
    { id: 'aries', name: '白羊座', date: '03.21-04.19', icon: '♈', color: '#ff8a80' },
    { id: 'taurus', name: '金牛座', date: '04.20-05.20', icon: '♉', color: '#ffb74d' },
    { id: 'gemini', name: '双子座', date: '05.21-06.21', icon: '♊', color: '#ffd54f' },
    { id: 'cancer', name: '巨蟹座', date: '06.22-07.22', icon: '♋', color: '#aed581' },
    { id: 'leo', name: '狮子座', date: '07.23-08.22', icon: '♌', color: '#ff8a80' },
    { id: 'virgo', name: '处女座', date: '08.23-09.22', icon: '♍', color: '#a1887f' },
    { id: 'libra', name: '天秤座', date: '09.23-10.23', icon: '♎', color: '#f8bbd0' },
    { id: 'scorpio', name: '天蝎座', date: '10.24-11.22', icon: '♏', color: '#9575cd' },
    { id: 'sagittarius', name: '射手座', date: '11.23-12.21', icon: '♐', color: '#7986cb' },
    { id: 'capricorn', name: '摩羯座', date: '12.22-01.19', icon: '♑', color: '#90a4ae' },
    { id: 'aquarius', name: '水瓶座', date: '01.20-02.18', icon: '♒', color: '#4fc3f7' },
    { id: 'pisces', name: '双鱼座', date: '02.19-03.20', icon: '♓', color: '#ba68c8' },
  ],

  zodiacYiJiPool: {
    love: {
      yi: ['主动表达心意', '安排浪漫约会', '倾听对方想法', '给伴侣准备小惊喜', '坦诚沟通', '拥抱与陪伴'],
      ji: ['冷战回避', '翻旧账', '怀疑对方', '忽略纪念日', '情绪化吵架', '不接电话'],
    },
    work: {
      yi: ['专注核心任务', '团队协作', '整理思路', '提出创意', '学习新技能', '主动汇报进展'],
      ji: ['临时改方案', '与同事争执', '拖延', '独自承担过重任务', '忽略细节', '开会走神'],
    },
    money: {
      yi: ['稳健理财', '小额投资', '记账复盘', '理性消费', '学习财经知识', '与人合作分成'],
      ji: ['大额消费', '冲动购物', '盲目跟风投资', '借钱给别人', '过度囤货', '高风险投资'],
    },
    life: {
      yi: ['亲近自然', '做瑜伽冥想', '阅读治愈系书籍', '泡澡放松', '约朋友下午茶', '早睡早起'],
      ji: ['熬夜加班', '暴饮暴食', '独自胡思乱想', '剧烈运动', '与人比较', '宅家不动'],
    },
  },

  baziTemplates: {
    甲: '性格仁慈刚健，宜静心养气',
    乙: '性格柔韧温和，宜广结善缘',
    丙: '性格热情开朗，宜展现自我',
    丁: '性格细腻温和，宜细致表达',
    戊: '性格厚重踏实，宜稳扎稳打',
    己: '性格包容谦逊，宜柔中带刚',
    庚: '性格刚毅果断，宜理性决断',
    辛: '性格纯净敏锐，宜精致生活',
    壬: '性格大度智慧，宜深度思考',
    癸: '性格内敛柔和，宜滋养身心',
  },

  mount(container) {
    const today = DB.todayKey();
    const history = DB.get('fortune_history', []);
    const todayHistory = history.filter(r => r.date === today);

    container.innerHTML = `
      <div class="page">
        ${Components.banner({
          module: 'fortune',
          title: '每日运势',
          sub: '温柔指引每一天，仅供娱乐参考～',
          actions: `<span class="tag btn-soft" style="margin-left:0;font-size:11px">仅供娱乐</span>`
        })}

        <div class="fortune-tabs">
          <div class="fortune-tab ${this.state.tab === 'zodiac' ? 'active' : ''}" data-ftab="zodiac">
            <div class="fortune-tab-ico">⭐</div>
            <div class="fortune-tab-label">星座运势</div>
          </div>
          <div class="fortune-tab ${this.state.tab === 'bazi' ? 'active' : ''}" data-ftab="bazi">
            <div class="fortune-tab-ico">☯️</div>
            <div class="fortune-tab-label">生辰八字</div>
          </div>
        </div>

        <div id="fortune-content"></div>

        ${todayHistory.length ? `
          <div class="card mt-16">
            <div class="card-title">
              <span class="card-title-ico">📜</span>今日运势记录
            </div>
            ${todayHistory.map(r => `
              <div class="fitness-item">
                <div class="fitness-item-info">
                  <div class="fitness-item-ico fitness-ico-default">${r.tab === 'zodiac' ? '⭐' : '☯️'}</div>
                  <div>
                    <div class="fitness-item-name">${Utils.esc(r.title)}</div>
                    <div class="fitness-item-meta">${r.time}</div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;

    if (this.state.tab === 'zodiac') {
      this.renderZodiac();
    } else {
      this.renderBazi();
    }

    this.bindEvents();
  },

  renderZodiac() {
    const el = document.getElementById('fortune-content');
    if (!el) return;
    el.innerHTML = `
      <div class="card mb-16">
        <div class="card-title">
          <span class="card-title-ico">🌟</span>选择你的星座
        </div>
        <div class="zodiac-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
          ${this.zodiacs.map(z => `
            <div class="zodiac-item ${this.state.selectedSign === z.id ? 'active' : ''}" data-sign="${z.id}"
              style="padding:10px 6px;border-radius:12px;text-align:center;cursor:pointer;background:${this.state.selectedSign === z.id ? 'var(--gradient-primary)' : 'var(--bg-card)'};border:1px solid var(--border-soft);transition:all 0.2s">
              <div style="font-size:24px;color:${this.state.selectedSign === z.id ? 'white' : z.color}">${z.icon}</div>
              <div style="font-size:11px;font-weight:500;margin-top:4px;color:${this.state.selectedSign === z.id ? 'white' : 'var(--text-primary)'}">${z.name}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div id="zodiac-result"></div>
    `;

    if (!this.state.selectedSign) {
      const user = DB.get('fortune_user', {});
      if (user.zodiac) this.state.selectedSign = user.zodiac;
    }

    this.bindZodiacEvents();
    if (this.state.selectedSign) {
      this.showZodiacFortune(this.state.selectedSign);
    } else {
      document.getElementById('zodiac-result').innerHTML = Components.empty({
        icon: '🌟',
        title: '选择你的星座',
        sub: '点击上方任意星座开始今天的运势查询',
        hero: true,
      });
    }
  },

  bindZodiacEvents() {
    document.querySelectorAll('[data-sign]').forEach(el => {
      el.addEventListener('click', () => {
        this.state.selectedSign = el.dataset.sign;
        const user = DB.get('fortune_user', {});
        user.zodiac = this.state.selectedSign;
        DB.set('fortune_user', user);
        this.showZodiacFortune(this.state.selectedSign);
      });
    });
  },

  showZodiacFortune(signId) {
    const z = this.zodiacs.find(x => x.id === signId);
    if (!z) return;
    const today = DB.todayKey();
    const cacheKey = `fortune_zodiac_${today}_${signId}`;
    let cached = DB.get(cacheKey);

    if (!cached) {
      const seed = (today + signId).split('').reduce((s, c) => s + c.charCodeAt(0), 0);
      const rng = mulberry32(seed);
      const pickYi = (arr) => arr[Math.floor(rng() * arr.length)];

      const scores = {
        love: Math.floor(rng() * 30) + 70,
        work: Math.floor(rng() * 30) + 70,
        money: Math.floor(rng() * 30) + 70,
        life: Math.floor(rng() * 30) + 70,
      };

      cached = {
        zodiac: signId,
        date: today,
        scores,
        summary: this.genZodiacSummary(z, scores),
        yi: {
          love: pickYi(this.zodiacYiJiPool.love.yi),
          work: pickYi(this.zodiacYiJiPool.work.yi),
          money: pickYi(this.zodiacYiJiPool.money.yi),
          life: pickYi(this.zodiacYiJiPool.life.yi),
        },
        ji: {
          love: pickYi(this.zodiacYiJiPool.love.ji),
          work: pickYi(this.zodiacYiJiPool.work.ji),
          money: pickYi(this.zodiacYiJiPool.money.ji),
          life: pickYi(this.zodiacYiJiPool.life.ji),
        },
        luckyColor: ['樱花粉', '薰衣草紫', '薄荷绿', '奶油黄', '天空蓝'][Math.floor(rng() * 5)],
        luckyNum: Math.floor(rng() * 9) + 1,
      };
      DB.set(cacheKey, cached);

      const history = DB.get('fortune_history', []);
      history.push({
        tab: 'zodiac',
        title: `${z.name} · ${today}`,
        time: new Date().toTimeString().slice(0, 5),
        date: today,
      });
      DB.set('fortune_history', history);
    }

    const el = document.getElementById('zodiac-result');
    if (!el) return;
    el.innerHTML = `
      <div class="fortune-result">
        <div class="flex-between mb-12">
          <div class="card-title" style="margin:0">
            <span class="card-title-ico" style="color:${z.color}">${z.icon}</span>
            ${z.name} 今日运势
          </div>
          <div class="text-sm text-muted">${today}</div>
        </div>

        <div class="fortune-score-row">
          <div class="fortune-score">
            <div class="score-ico">💖</div>
            <div class="score-num">${cached.scores.love}</div>
            <div class="score-label">感情</div>
          </div>
          <div class="fortune-score">
            <div class="score-ico">💼</div>
            <div class="score-num">${cached.scores.work}</div>
            <div class="score-label">工作</div>
          </div>
          <div class="fortune-score">
            <div class="score-ico">💰</div>
            <div class="score-num">${cached.scores.money}</div>
            <div class="score-label">财运</div>
          </div>
          <div class="fortune-score">
            <div class="score-ico">🌸</div>
            <div class="score-num">${cached.scores.life}</div>
            <div class="score-label">生活</div>
          </div>
        </div>

        <div class="fortune-summary">${Utils.esc(cached.summary)}</div>

        <div class="mt-16 mb-8 font-medium" style="color:#4a7c4f">🌿 宜做事项</div>
        <div>
          <span class="fortune-tag tag-yi">💖 感情：${Utils.esc(cached.yi.love)}</span>
          <span class="fortune-tag tag-yi">💼 工作：${Utils.esc(cached.yi.work)}</span>
          <span class="fortune-tag tag-yi">💰 财务：${Utils.esc(cached.yi.money)}</span>
          <span class="fortune-tag tag-yi">🌸 生活：${Utils.esc(cached.yi.life)}</span>
        </div>

        <div class="mt-12 mb-8 font-medium" style="color:#b34d4d">🚫 忌做事项</div>
        <div>
          <span class="fortune-tag tag-ji">💖 感情：${Utils.esc(cached.ji.love)}</span>
          <span class="fortune-tag tag-ji">💼 工作：${Utils.esc(cached.ji.work)}</span>
          <span class="fortune-tag tag-ji">💰 财务：${Utils.esc(cached.ji.money)}</span>
          <span class="fortune-tag tag-ji">🌸 生活：${Utils.esc(cached.ji.life)}</span>
        </div>

        <div class="flex-between mt-16 pt-12" style="border-top:1px dashed var(--border-soft)">
          <div class="text-sm text-secondary">幸运色：<strong style="color:var(--primary-deep)">${Utils.esc(cached.luckyColor)}</strong></div>
          <div class="text-sm text-secondary">幸运数字：<strong style="color:var(--primary-deep)">${cached.luckyNum}</strong></div>
        </div>
      </div>
    `;

    document.querySelectorAll('[data-sign]').forEach(el => {
      if (el.dataset.sign === signId) {
        el.classList.add('active');
        el.style.background = 'var(--gradient-primary)';
        el.querySelector('div').style.color = 'white';
        el.querySelector('div + div').style.color = 'white';
      } else {
        el.classList.remove('active');
        el.style.background = 'var(--bg-card)';
        const z2 = this.zodiacs.find(x => x.id === el.dataset.sign);
        el.querySelector('div').style.color = z2.color;
        el.querySelector('div + div').style.color = 'var(--text-primary)';
      }
    });
  },

  genZodiacSummary(z, scores) {
    const avg = (scores.love + scores.work + scores.money + scores.life) / 4;
    let level = '';
    if (avg >= 90) level = '超级幸运日';
    else if (avg >= 80) level = '诸事顺遂';
    else if (avg >= 70) level = '稳中向好';
    else level = '宜静守心';

    const templates = [
      `${level}！今天的${z.name}似乎被宇宙温柔以待，记得保持微笑，把好运分享给身边的人。`,
      `今天是${z.name}的${level}日，适合尝试一些平时不敢做的事，会有意想不到的收获哦～`,
      `${z.name}今天${level}，无论遇到什么，都请记得：你值得世间所有的美好。`,
      `宇宙给${z.name}送来祝福：${level}。今天适合穿${z.name}的幸运色，让能量满满～`,
    ];
    const seed = z.id + Math.floor(avg);
    return templates[seed.length % templates.length];
  },

  renderBazi() {
    const el = document.getElementById('fortune-content');
    if (!el) return;

    const user = DB.get('fortune_user', {});

    el.innerHTML = `
      <div class="card mb-16">
        <div class="card-title">
          <span class="card-title-ico">📜</span>输入生辰信息（阳历）
        </div>
        <div class="card-grid-2">
          <div>
            <label class="text-sm text-secondary mb-4" style="display:block">出生日期</label>
            <input type="date" class="input" id="bazi-date" value="${user.baziDate || ''}" />
          </div>
          <div>
            <label class="text-sm text-secondary mb-4" style="display:block">出生时辰</label>
            <select class="select" id="bazi-hour">
              <option value="">请选择</option>
              ${['子时 (23-01)', '丑时 (01-03)', '寅时 (03-05)', '卯时 (05-07)', '辰时 (07-09)', '巳时 (09-11)', '午时 (11-13)', '未时 (13-15)', '申时 (15-17)', '酉时 (17-19)', '戌时 (19-21)', '亥时 (21-23)'].map((s, i) => `
                <option value="${i}" ${user.baziHour === String(i) ? 'selected' : ''}>${s}</option>
              `).join('')}
            </select>
          </div>
        </div>
        <div class="mt-12">
          <label class="text-sm text-secondary mb-4" style="display:block">性别</label>
          <div class="flex gap-12">
            <label class="flex gap-6 flex-center" style="cursor:pointer">
              <input type="radio" name="bazi-gender" value="female" ${user.baziGender !== 'male' ? 'checked' : ''} />
              <span>女</span>
            </label>
            <label class="flex gap-6 flex-center" style="cursor:pointer">
              <input type="radio" name="bazi-gender" value="male" ${user.baziGender === 'male' ? 'checked' : ''} />
              <span>男</span>
            </label>
          </div>
        </div>
        <button class="btn-primary btn-block mt-16" id="bazi-submit">开始排盘</button>
      </div>

      <div id="bazi-result"></div>
    `;

    document.getElementById('bazi-submit')?.addEventListener('click', () => {
      const date = document.getElementById('bazi-date').value;
      const hour = document.getElementById('bazi-hour').value;
      const genderEl = document.querySelector('input[name="bazi-gender"]:checked');
      const gender = genderEl ? genderEl.value : 'female';
      if (!date || hour === '') {
        Utils.toast('请填写完整信息哦～', 'warning');
        return;
      }
      const u = DB.get('fortune_user', {});
      u.baziDate = date;
      u.baziHour = hour;
      u.baziGender = gender;
      DB.set('fortune_user', u);
      this.computeBazi(date, hour, gender);
    });

    if (user.baziDate) {
      this.computeBazi(user.baziDate, user.baziHour, user.baziGender);
    } else {
      document.getElementById('bazi-result').innerHTML = '';
    }
  },

  /* ============================================================
     八字排盘 - 算法完全重写（节气月柱 + 60甲子日柱表 + 五鼠遁时柱）
     ============================================================
     算法要点：
     1. 年柱：按立春切换年（立春前算上一年），(year - 4) % 60 索引
     2. 月柱：按节气切月（不是农历月，也不是阳历月）
     3. 日柱：60甲子轮转，起点基准日 + 天数差
     4. 时柱：5 鼠遁法（日干决定起时天干）
     ============================================================ */
  computeBazi(dateStr, hourIdx, gender) {
    const today = DB.todayKey();
    const cacheKey = `fortune_bazi_v3_${today}_${dateStr}_${hourIdx}_${gender}`;
    let cached = DB.get(cacheKey);

    if (!cached) {
      const [year, month, day] = dateStr.split('-').map(Number);
      const hour = parseInt(hourIdx);

      const result = this.calcBazi(year, month, day, hour);
      const pillarStr = `${result.yearPillar}年 ${result.monthPillar}月 ${result.dayPillar}日 ${result.hourPillar}时`;

      // 奇门遁甲规则不再演示，仅做完整八字+五行简析
      const fiveElements = this.analyzeFiveElements([
        result.yearPillar, result.monthPillar, result.dayPillar, result.hourPillar
      ]);

      const seed = (today + dateStr + hourIdx).split('').reduce((s, c) => s + c.charCodeAt(0), 0);
      const rng = mulberry32(seed);
      const pickYi = (arr) => arr[Math.floor(rng() * arr.length)];

      cached = {
        date: today,
        bazi: pillarStr,
        yearPillar: result.yearPillar,
        monthPillar: result.monthPillar,
        dayPillar: result.dayPillar,
        hourPillar: result.hourPillar,
        dayGan: result.dayPillar[0],
        yearGan: result.yearPillar[0],
        yearZhi: result.yearPillar[1],
        nature: this.baziTemplates[result.yearPillar[0]],
        fiveElements,
        summary: this.genBaziSummary(result.yearPillar[0], result.dayPillar[0]),
        scores: {
          overall: Math.floor(rng() * 30) + 70,
          career: Math.floor(rng() * 30) + 70,
          wealth: Math.floor(rng() * 30) + 70,
          health: Math.floor(rng() * 30) + 70,
        },
        yi: {
          life: pickYi(['冥想静坐', '与家人团聚', '亲近自然', '整理房间', '读古文', '泡脚养生']),
          career: pickYi(['处理重要文档', '与长辈沟通', '系统总结', '倾听他人建议', '制定长期计划']),
          wealth: pickYi(['稳健理财', '记账复盘', '保守投资', '存钱', '购置必需品']),
          health: pickYi(['八段锦', '热水泡脚', '清淡饮食', '充足睡眠', '散步']),
        },
        ji: {
          life: pickYi(['熬夜', '暴怒', '争执', '与人比较', '宅家不动', '过度社交']),
          career: pickYi(['做重大决定', '与人争吵', '加班熬夜', '推卸责任', '胡乱猜测']),
          wealth: pickYi(['冲动消费', '借钱出去', '高风险投资', '与人合伙', '赌博']),
          health: pickYi(['剧烈运动', '饮酒过量', '吃生冷', '过度劳累', '情绪激动']),
        },
      };
      DB.set(cacheKey, cached);

      const history = DB.get('fortune_history', []);
      history.push({
        tab: 'bazi',
        title: `八字 · ${dateStr} ${result.hourPillar}时`,
        time: new Date().toTimeString().slice(0, 5),
        date: today,
      });
      DB.set('fortune_history', history);
    }

    const el = document.getElementById('bazi-result');
    if (!el) return;
    el.innerHTML = `
      <div class="fortune-result">
        <div class="card-title">
          <span class="card-title-ico">☯️</span>今日八字运势
        </div>

        <div class="card-soft mb-12" style="text-align:center">
          <div class="text-sm text-secondary mb-4">你的生辰（阳历）· ${Utils.esc(dateStr)} · ${hourIdx === '' ? '' : ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][parseInt(hourIdx)]}时</div>
          <div style="display:flex;justify-content:center;gap:6px;margin:12px 0">
            ${[cached.yearPillar, cached.monthPillar, cached.dayPillar, cached.hourPillar].map(p => `
              <div style="min-width:50px;padding:10px 6px;background:white;border-radius:10px;text-align:center;border:1px solid rgba(255,143,188,0.2)">
                <div style="font-size:22px;font-weight:bold;color:#c2185b;font-family:serif">${p[0]}</div>
                <div style="font-size:14px;color:#7b5c8c">${p[1]}</div>
              </div>
            `).join('<div style="color:rgba(0,0,0,0.3);display:flex;align-items:center;font-size:18px">|</div>')}
          </div>
          <div class="text-sm text-secondary">${Utils.esc(cached.bazi)}</div>
          <div class="text-sm text-muted mt-4">${Utils.esc(cached.nature)}</div>
        </div>

        <div class="card-soft mb-12">
          <div class="text-sm text-secondary mb-8">五行分布</div>
          ${Object.entries(cached.fiveElements).map(([k, v]) => `
            <div class="flex-between mb-4" style="gap:8px">
              <span style="min-width:48px;font-size:13px">${k}</span>
              <div style="flex:1;height:8px;background:rgba(255,143,188,0.1);border-radius:4px;overflow:hidden">
                <div style="height:100%;background:linear-gradient(90deg,#ff8fbc,#ffb3d1);width:${v}%"></div>
              </div>
              <span style="min-width:36px;text-align:right;font-size:12px;color:var(--text-muted)">${v}%</span>
            </div>
          `).join('')}
        </div>

        <div class="fortune-score-row">
          <div class="fortune-score">
            <div class="score-ico">🌟</div>
            <div class="score-num">${cached.scores.overall}</div>
            <div class="score-label">综合</div>
          </div>
          <div class="fortune-score">
            <div class="score-ico">💼</div>
            <div class="score-num">${cached.scores.career}</div>
            <div class="score-label">事业</div>
          </div>
          <div class="fortune-score">
            <div class="score-ico">💰</div>
            <div class="score-num">${cached.scores.wealth}</div>
            <div class="score-label">财运</div>
          </div>
          <div class="fortune-score">
            <div class="score-ico">🌿</div>
            <div class="score-num">${cached.scores.health}</div>
            <div class="score-label">健康</div>
          </div>
        </div>

        <div class="fortune-summary">${Utils.esc(cached.summary)}</div>

        <div class="mt-16 mb-8 font-medium" style="color:#4a7c4f">🌿 今日宜做</div>
        <div>
          <span class="fortune-tag tag-yi">生活：${Utils.esc(cached.yi.life)}</span>
          <span class="fortune-tag tag-yi">事业：${Utils.esc(cached.yi.career)}</span>
          <span class="fortune-tag tag-yi">财运：${Utils.esc(cached.yi.wealth)}</span>
          <span class="fortune-tag tag-yi">健康：${Utils.esc(cached.yi.health)}</span>
        </div>

        <div class="mt-12 mb-8 font-medium" style="color:#b34d4d">🚫 今日忌做</div>
        <div>
          <span class="fortune-tag tag-ji">生活：${Utils.esc(cached.ji.life)}</span>
          <span class="fortune-tag tag-ji">事业：${Utils.esc(cached.ji.career)}</span>
          <span class="fortune-tag tag-ji">财运：${Utils.esc(cached.ji.wealth)}</span>
          <span class="fortune-tag tag-ji">健康：${Utils.esc(cached.ji.health)}</span>
        </div>

        <div class="mt-16 text-sm text-muted" style="line-height:1.6;padding:12px;background:rgba(255,236,247,0.5);border-radius:10px">
          💡 本模块基于传统节气+60甲子推算，与「测测」等命理工具算法互参，仅供娱乐参考，人生靠自己书写 🌸
        </div>
      </div>
    `;
  },

  /* ---------- 八字计算核心 ---------- */
  // 返回 { yearPillar, monthPillar, dayPillar, hourPillar }
  calcBazi(year, month, day, hour) {
    return {
      yearPillar: this.getYearPillar(year, month, day),
      monthPillar: this.getMonthPillar(year, month, day),
      dayPillar: this.getDayPillar(year, month, day),
      hourPillar: this.getHourPillar(year, month, day, hour),
    };
  },

  // 24 节气近似日期（公历）：用于月柱定月
  solarTerms2025: {
    // 月份索引 0-11 → 各月节气起始日（含）
    // 立春(2月)、惊蛰(3月)、清明(4月)、立夏(5月)、芒种(6月)、小暑(7月)、
    // 立秋(8月)、白露(9月)、寒露(10月)、立冬(11月)、大雪(12月)、小寒(1月)
    // 每年节气日期略有偏差（±1天），用近似值足够
    1: 5,    // 小寒 → 1月5日左右
    2: 4,    // 立春 → 2月4日
    3: 5,    // 惊蛰 → 3月5日
    4: 4,    // 清明 → 4月4日
    5: 5,    // 立夏 → 5月5日
    6: 5,    // 芒种 → 6月5日
    7: 7,    // 小暑 → 7月7日
    8: 7,    // 立秋 → 8月7日
    9: 7,    // 白露 → 9月7日
    10: 8,   // 寒露 → 10月8日
    11: 7,   // 立冬 → 11月7日
    12: 7,   // 大雪 → 12月7日
  },

  // 年柱：(年份 - 4) 对 60 取模，基准 1984 = 甲子年（其实 1984 = 甲子年是闰年，立春 2-4 后才是）
  // 简化：以立春为界（公历 2月4日 左右），立春前算上一年
  getYearPillar(year, month, day) {
    // 立春前 → 上一年
    let y = year;
    if (month === 2 && day < this.solarTerms2025[2]) y -= 1;
    if (month === 1) y -= 1;
    const gan = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'][(y - 4) % 10];
    const zhi = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][(y - 4) % 12];
    return gan + zhi;
  },

  // 月柱：节气切月 + 五虎遁
  // 节气月支索引：寅月(正月)=2, 卯月=3, 辰月=4, 巳月=5, 午月=6, 未月=7,
  //              申月=7, 酉月=9, 戌月=10, 亥月=11, 子月=0, 丑月=1
  getMonthPillar(year, month, day) {
    // 根据节气定月支
    let zhiIdx;
    const t = (m) => this.solarTerms2025[m];

    if ((month === 12 && day >= t(12)) || (month === 1 && day < t(1))) {
      zhiIdx = 0; // 子月（十一月）
    } else if ((month === 1 && day >= t(1)) || (month === 2 && day < t(2))) {
      zhiIdx = 1; // 丑月（十二月）
    } else if ((month === 2 && day >= t(2)) || (month === 3 && day < t(3))) {
      zhiIdx = 2; // 寅月（正月）
    } else if ((month === 3 && day >= t(3)) || (month === 4 && day < t(4))) {
      zhiIdx = 3; // 卯月（二月）
    } else if ((month === 4 && day >= t(4)) || (month === 5 && day < t(5))) {
      zhiIdx = 4; // 辰月（三月）
    } else if ((month === 5 && day >= t(5)) || (month === 6 && day < t(6))) {
      zhiIdx = 5; // 巳月（四月）
    } else if ((month === 6 && day >= t(6)) || (month === 7 && day < t(7))) {
      zhiIdx = 6; // 午月（五月）
    } else if ((month === 7 && day >= t(7)) || (month === 8 && day < t(8))) {
      zhiIdx = 7; // 未月（六月）
    } else if ((month === 8 && day >= t(8)) || (month === 9 && day < t(9))) {
      zhiIdx = 8; // 申月（七月）
    } else if ((month === 9 && day >= t(9)) || (month === 10 && day < t(10))) {
      zhiIdx = 9; // 酉月（八月）
    } else if ((month === 10 && day >= t(10)) || (month === 11 && day < t(11))) {
      zhiIdx = 10; // 戌月（九月）
    } else if ((month === 11 && day >= t(11)) || (month === 12 && day < t(12))) {
      zhiIdx = 11; // 亥月（十月）
    }

    const zhi = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][zhiIdx];

    // 五虎遁：年干决定寅月起月天干
    const yearGan = this.getYearPillar(year, month, day)[0];
    const yinGanStart = {
      '甲': 2, '己': 2,
      '乙': 4, '庚': 4,
      '丙': 6, '辛': 6,
      '丁': 8, '壬': 8,
      '戊': 0, '癸': 0,
    }[yearGan];

    // 当前月到寅月的偏移
    let offsetFromYin;
    if (zhiIdx >= 2) offsetFromYin = zhiIdx - 2;
    else offsetFromYin = zhiIdx + 10;

    const ganIdx = (yinGanStart + offsetFromYin) % 10;
    const gan = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'][ganIdx];
    return gan + zhi;
  },

  // 日柱：60甲子（基于1900-01-31=甲辰日索引40验证）
  // 已知参考：1989-04-01 = 辛卯日（验证基准）
  getDayPillar(year, month, day) {
    // 已知参考点：1989-04-01 = 辛卯（60甲子索引 27）
    // 计算与 1989-04-01 的天数差，得到目标日索引
    const baseDate = new Date(Date.UTC(1989, 3, 1)); // 月份从0开始，3=4月
    const targetDate = new Date(Date.UTC(year, month - 1, day));
    const days = Math.floor((targetDate - baseDate) / 86400000);
    const targetIdx = ((27 + days) % 60 + 60) % 60;
    const allStems = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
    const allBranches = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
    return allStems[targetIdx % 10] + allBranches[targetIdx % 12];
  },

  // 时柱：5 鼠遁（日干决定子时起干）
  // 甲己还加甲（甲子），乙庚丙作初（丙子），丙辛从戊起（戊子），
  // 丁壬庚子居（庚子），戊癸何方发，壬子是真途（壬子）
  getHourPillar(year, month, day, hour) {
    const dayGan = this.getDayPillar(year, month, day)[0];
    const ziGan = {
      '甲': 0, '己': 0,
      '乙': 2, '庚': 2,
      '丙': 4, '辛': 4,
      '丁': 6, '壬': 6,
      '戊': 8, '癸': 8,
    }[dayGan];
    const offset = hour; // 子=0, 丑=1, 寅=2, ..., 亥=11
    const ganIdx = (ziGan + offset) % 10;
    const zhiIdx = hour;
    const allStems = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
    const allBranches = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
    return allStems[ganIdx] + allBranches[zhiIdx];
  },

  // 五行统计
  analyzeFiveElements(pillars) {
    const fiveMap = {
      '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土',
      '庚': '金', '辛': '金', '壬': '水', '癸': '水',
    };
    const zhiFiveMap = {
      '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
      '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水',
    };
    let counts = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };
    pillars.forEach(p => {
      counts[fiveMap[p[0]]] += 1.5; // 天干权重高
      counts[zhiFiveMap[p[1]]] += 1; // 地支
    });
    const total = Object.values(counts).reduce((s, v) => s + v, 0);
    const pct = {};
    Object.entries(counts).forEach(([k, v]) => {
      pct[k] = Math.round(v / total * 100);
    });
    return pct;
  },

  genBaziSummary(yearGan, dayGan) {
    const map = {
      甲: '今日宜主动出击，但忌急躁冒进。',
      乙: '今日宜柔中带刚，顺势而为。',
      丙: '今日阳光照耀，适合展现光芒。',
      丁: '今日温暖细腻，宜专注一事。',
      戊: '今日稳如磐石，宜厚积薄发。',
      己: '今日滋养万物，宜宽厚待人。',
      庚: '今日锐不可当，宜理性决断。',
      辛: '今日纯净明朗，宜精致生活。',
      壬: '今日智慧如水，宜深度思考。',
      癸: '今日滋润万物，宜静心滋养。',
    };
    return `${map[yearGan]}${map[dayGan]}记得保持好心情，温柔对待每一天～`;
  },

  bindEvents() {
    document.querySelectorAll('[data-ftab]').forEach(el => {
      el.addEventListener('click', () => {
        this.state.tab = el.dataset.ftab;
        this.mount(document.getElementById('app-main'));
      });
    });
  },
};

function mulberry32(seed) {
  return function() {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

window.Fortune = Fortune;
