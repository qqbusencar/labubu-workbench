/* ============================================================
   模块四：每日运势
   ============================================================ */

const Fortune = {
  state: {
    tab: 'zodiac', // zodiac / bazi
    selectedSign: null,
    bazi: null,
  },

  // 12 星座基础数据
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

  // 星座宜忌模板池（按日随机）
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

  // 生辰八字基础
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

    // 自动用用户之前选过的
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
      // 当日缓存生成
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

      // 加入历史
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

    // 更新选择状态
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
          <span class="card-title-ico">📜</span>输入生辰信息
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

  computeBazi(dateStr, hourIdx, gender) {
    const today = DB.todayKey();
    const cacheKey = `fortune_bazi_${today}_${dateStr}_${hourIdx}_${gender}`;
    let cached = DB.get(cacheKey);

    if (!cached) {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hour = parseInt(hourIdx);

      // 简化天干地支计算（演示用）
      const tiangan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
      const dizhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
      const yearGan = tiangan[(year - 4) % 10];
      const yearZhi = dizhi[(year - 4) % 12];
      const monthGan = tiangan[(month + (yearGan === '甲' || yearGan === '己' ? 0 : yearGan === '乙' || yearGan === '庚' ? 2 : 4)) % 10];
      const monthZhi = dizhi[(month + 1) % 12];
      const dayGan = tiangan[(year * 365 + month * 30 + day) % 10];
      const dayZhi = dizhi[(year * 365 + month * 30 + day) % 12];
      const hourZhi = dizhi[hour];

      const seed = (today + dateStr + hourIdx).split('').reduce((s, c) => s + c.charCodeAt(0), 0);
      const rng = mulberry32(seed);
      const pickYi = (arr) => arr[Math.floor(rng() * arr.length)];

      cached = {
        date: today,
        bazi: `${yearGan}${yearZhi}年 ${monthGan}${monthZhi}月 ${dayGan}${dayZhi}日 ${hourZhi}时`,
        yearChar: yearGan,
        nature: this.baziTemplates[yearGan],
        summary: this.genBaziSummary(yearGan, dayGan),
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
        title: `八字 · ${dateStr} ${dizhi[hour]}时`,
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

        <div class="card-soft mb-12">
          <div class="text-sm text-secondary mb-4">你的生辰</div>
          <div class="text-lg font-bold text-primary-color">${Utils.esc(cached.bazi)}</div>
          <div class="text-sm text-muted mt-4">${Utils.esc(cached.nature)}</div>
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
      </div>
    `;
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

// 简易种子伪随机
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