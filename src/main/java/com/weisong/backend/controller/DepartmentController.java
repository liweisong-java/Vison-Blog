package com.weisong.backend.controller;

import com.weisong.backend.entities.Department;
import com.weisong.backend.service.DepartmentService;
import com.weisong.backend.util.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * @author 李伟松
 * @create 2022-02-17-19:26
 */
@RestController
@RequestMapping(value = "/emps")
@CrossOrigin(origins = "http://localhost:9527", maxAge = 3600)
public class DepartmentController {
    @Autowired
    DepartmentService departmentService;

    @ResponseBody
    @GetMapping(value = "/listDept")
    public Result getAllDept(){

        List<Department> allDept = departmentService.getAllDept();
        return Result.success(allDept);
    }

    @ResponseBody
    @RequestMapping(value = "/addDept",method = RequestMethod.POST)
    public Result addEmployee(@RequestBody Department department){
        return Result.success(departmentService.insertDept(department));
    }

}
