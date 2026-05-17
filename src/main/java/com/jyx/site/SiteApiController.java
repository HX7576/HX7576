package com.jyx.site;

import com.jyx.Data_unification.Unification;
import com.jyx.healthsys.entity.Body;
import com.jyx.healthsys.entity.BodyNotes;
import com.jyx.healthsys.service.IBodyNotesService;
import com.jyx.healthsys.service.IBodyService;
import com.jyx.healthsys.service.IMenuService;
import com.jyx.healthsys.service.IRoleService;
import com.jyx.healthsys.service.ISportInfoService;
import com.jyx.healthsys.service.IUserService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/site")
public class SiteApiController {

    private final IBodyService bodyService;
    private final IBodyNotesService bodyNotesService;
    private final ISportInfoService sportInfoService;
    private final IUserService userService;
    private final IRoleService roleService;
    private final IMenuService menuService;

    public SiteApiController(IBodyService bodyService,
                             IBodyNotesService bodyNotesService,
                             ISportInfoService sportInfoService,
                             IUserService userService,
                             IRoleService roleService,
                             IMenuService menuService) {
        this.bodyService = bodyService;
        this.bodyNotesService = bodyNotesService;
        this.sportInfoService = sportInfoService;
        this.userService = userService;
        this.roleService = roleService;
        this.menuService = menuService;
    }

    @GetMapping("/ping")
    public Unification<Map<String, Object>> ping() {
        Map<String, Object> data = new HashMap<>();
        data.put("database", "health");
        data.put("status", "connected");
        data.put("records", bodyNotesService.count());
        return Unification.success(data, "后端和数据库连接正常");
    }

    @GetMapping("/dashboard")
    public Unification<Map<String, Object>> dashboard() {
        Map<String, Object> data = new HashMap<>();
        List<BodyNotes> notes = bodyNotesService.list();
        data.put("records", notes);
        data.put("latest", notes.isEmpty() ? null : notes.get(notes.size() - 1));
        data.put("sports", sportInfoService.list());
        return Unification.success(data);
    }

    @GetMapping("/health-records")
    public Unification<List<BodyNotes>> healthRecords() {
        return Unification.success(bodyNotesService.list());
    }

    @PostMapping("/body")
    public Unification<Map<String, Object>> saveBody(@RequestBody Body body) {
        boolean currentSaved = bodyService.insert(body);
        BodyNotes note = new BodyNotes();
        note.setId(body.getId());
        note.setName(body.getName());
        note.setAge(body.getAge());
        note.setGender(body.getGender());
        note.setHeight(body.getHeight());
        note.setWeight(body.getWeight());
        note.setBloodSugar(body.getBloodSugar());
        note.setBloodPressure(body.getBloodPressure());
        note.setBloodLipid(body.getBloodLipid());
        note.setHeartRate(body.getHeartRate());
        note.setVision(body.getVision());
        note.setSleepDuration(body.getSleepDuration());
        note.setSleepQuality(body.getSleepQuality());
        note.setSmoking(body.isSmoking());
        note.setDrinking(body.isDrinking());
        note.setExercise(body.isExercise());
        note.setFoodTypes(body.getFoodTypes());
        note.setWaterConsumption(body.getWaterConsumption());
        note.setDate(new Date());
        bodyNotesService.insert(note);

        Map<String, Object> data = new HashMap<>();
        data.put("currentSaved", currentSaved);
        data.put("record", note);
        return Unification.success(data, "保存成功");
    }

    @GetMapping("/sports")
    public Unification<?> sports() {
        return Unification.success(sportInfoService.list());
    }

    @GetMapping("/admin")
    public Unification<Map<String, Object>> admin() {
        Map<String, Object> data = new HashMap<>();
        data.put("users", userService.list());
        data.put("roles", roleService.list());
        data.put("menus", menuService.list());
        return Unification.success(data);
    }
}
